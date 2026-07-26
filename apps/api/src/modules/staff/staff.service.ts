import { ConflictException, ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { Role } from '../../common/enums';
import { assertCanAssignRole, assertCanManageStaffTarget, assertCanRestoreStaff, assertStaffResourceAccess } from '../../common/policies/user.policy';
import { QueryStaffDto } from './dto/query-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
const staffRoles = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.INVENTORY_MANAGER, Role.ORDER_MANAGER];
const staffSelect = {
  id: true, email: true, name: true, phone: true, avatar: true, role: true, provider: true,
  emailVerifiedAt: true, activationStatus: true, isActive: true, lockedUntil: true,
  createdAt: true, updatedAt: true, deletedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async findAll(query: QueryStaffDto, actorRole: Role) {
    assertStaffResourceAccess(actorRole);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = { role: query.role ?? { in: staffRoles }, ...(query.includeDeleted && actorRole === Role.SUPER_ADMIN ? {} : { deletedAt: null }) };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: staffSelect, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string, actorRole: Role) {
    assertStaffResourceAccess(actorRole);
    const staff = await this.prisma.user.findFirst({ where: { id, role: { in: staffRoles }, deletedAt: null }, select: staffSelect });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async create(dto: CreateStaffDto, actorRole: Role) {
    assertCanAssignRole(actorRole, dto.role as Role);
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null }, select: { id: true } });
    if (existing) throw new ConflictException('Email already registered');
    const user = await this.prisma.user.create({ data: { email: dto.email, name: dto.name, role: dto.role, password: null, activationStatus: 'PENDING_ACTIVATION', isActive: false }, select: staffSelect });
    await this.sendInvitation(user.id, user.email, user.name);
    return user;
  }

  async update(id: string, dto: UpdateStaffDto, actorId: string, actorRole: Role) {
    const target = await this.prisma.user.findFirst({ where: { id, role: { in: staffRoles }, deletedAt: null }, select: { id: true, role: true } });
    if (!target) throw new NotFoundException('Staff not found');
    assertCanManageStaffTarget(actorRole, target.role as Role, actorId, target.id);
    if (dto.role) assertCanAssignRole(actorRole, dto.role as Role);
    return this.prisma.user.update({ where: { id }, data: dto, select: staffSelect });
  }

  async remove(id: string, actorId: string, actorRole: Role) {
    const target = await this.prisma.user.findFirst({ where: { id, role: { in: staffRoles }, deletedAt: null }, select: { id: true, role: true } });
    if (!target) throw new NotFoundException('Staff not found');
    assertCanManageStaffTarget(actorRole, target.role as Role, actorId, target.id);
    return this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, tokenVersion: { increment: 1 } }, select: staffSelect });
  }

  async restore(id: string, actorRole: Role) {
    const target = await this.prisma.user.findFirst({ where: { id, role: { in: staffRoles }, deletedAt: { not: null } }, select: { id: true, role: true } });
    if (!target) throw new NotFoundException('Deleted staff not found');
    assertCanRestoreStaff(actorRole, target.role as Role);
    return this.prisma.user.update({ where: { id }, data: { deletedAt: null, isActive: true, tokenVersion: { increment: 1 } }, select: staffSelect });
  }

  async resendInvite(id: string, actorId: string, actorRole: Role) {
    const target = await this.prisma.user.findFirst({ where: { id, role: { in: staffRoles }, deletedAt: null }, select: { id: true, role: true, email: true, name: true, activationStatus: true } });
    if (!target) throw new NotFoundException('Staff not found');
    assertCanManageStaffTarget(actorRole, target.role as Role, actorId, target.id);
    if (target.activationStatus !== 'PENDING_ACTIVATION') throw new BadRequestException('Staff account is already active');
    await this.sendInvitation(target.id, target.email, target.name);
    return { message: 'Invitation sent' };
  }

  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    const hash = this.hashToken(token);
    const invitation = await this.prisma.staffInvitationToken.findUnique({ where: { tokenHash: hash }, include: { user: true } });
    if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date() || invitation.user.activationStatus !== 'PENDING_ACTIVATION' || invitation.user.deletedAt) {
      throw new BadRequestException('Invalid or expired invitation');
    }
    const password = await bcrypt.hash(dto.password, 10);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.staffInvitationToken.updateMany({ where: { id: invitation.id, usedAt: null }, data: { usedAt: now } });
      if (consumed.count !== 1) throw new BadRequestException('Invalid or expired invitation');
      await tx.user.update({ where: { id: invitation.userId }, data: { password, activationStatus: 'ACTIVE', isActive: true } });
      await tx.staffInvitationToken.updateMany({ where: { userId: invitation.userId, usedAt: null }, data: { usedAt: now } });
    });
    return { message: 'Invitation accepted' };
  }

  private async sendInvitation(userId: string, email: string, name: string) {
    await this.prisma.staffInvitationToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.staffInvitationToken.create({ data: { tokenHash: this.hashToken(rawToken), userId, expiresAt: new Date(Date.now() + INVITATION_TTL_MS) } });
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    await this.emailService.sendStaffInvitationEmail(email, name, `${frontendUrl}/staff/activate?token=${rawToken}`);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
