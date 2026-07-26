import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums';
import { assertCanMutateCustomer, assertCustomerResourceAccess } from '../../common/policies/user.policy';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateAddressDto } from '../addresses/dto/update-address.dto';
import { AddressesService } from '../addresses/addresses.service';

const customerSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatar: true,
  role: true,
  provider: true,
  emailVerifiedAt: true,
  isActive: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

const customerDetailSelect = {
  ...customerSelect,
  internalNote: true,
  addresses: true,
  orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
} satisfies Prisma.UserSelect;

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private addressesService: AddressesService,
  ) {}

  async findAll(query: QueryCustomerDto, actorRole: Role) {
    assertCustomerResourceAccess(actorRole);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = { role: Role.CUSTOMER, deletedAt: null };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.isLocked === true) where.lockedUntil = { gt: new Date() };
    if (query.isLocked === false) where.OR = [{ lockedUntil: null }, { lockedUntil: { lte: new Date() } }];
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: customerSelect, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string, actorRole: Role) {
    assertCustomerResourceAccess(actorRole);
    const customer = await this.prisma.user.findFirst({
      where: { id, role: Role.CUSTOMER, deletedAt: null },
      select: customerDetailSelect,
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, actorRole: Role) {
    assertCanMutateCustomer(actorRole);
    const customer = await this.prisma.user.findFirst({ where: { id, role: Role.CUSTOMER, deletedAt: null }, select: { id: true } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.user.update({ where: { id }, data: dto, select: customerSelect });
  }

  async unlock(id: string, actorRole: Role) {
    assertCanMutateCustomer(actorRole);
    const customer = await this.prisma.user.findFirst({ where: { id, role: Role.CUSTOMER, deletedAt: null }, select: { id: true } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.user.update({ where: { id }, data: { failedLoginAttempts: 0, lockedUntil: null }, select: customerSelect });
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    dto: UpdateAddressDto,
    actorRole: Role,
  ) {
    assertCanMutateCustomer(actorRole);
    const customer = await this.prisma.user.findFirst({
      where: { id: customerId, role: Role.CUSTOMER, deletedAt: null },
      select: { id: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.addressesService.updateForAdmin(customer.id, addressId, dto);
  }
}
