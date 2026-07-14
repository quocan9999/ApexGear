import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponType } from '../../common/enums';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coupon.count(),
    ]);

    return {
      data: data.map((c) => this.serialize(c)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async create(dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        description: dto.description,
        minOrderValue: dto.minOrderValue,
        maxDiscount: dto.maxDiscount,
        maxUses: dto.maxUses,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
    return this.serialize(coupon);
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.ensureExists(id);
    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      const clash = await this.prisma.coupon.findFirst({
        where: { code, NOT: { id } },
      });
      if (clash) throw new ConflictException('Coupon code already exists');
      dto.code = code;
    }

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        startsAt:
          dto.startsAt === undefined
            ? undefined
            : dto.startsAt
              ? new Date(dto.startsAt)
              : null,
        expiresAt:
          dto.expiresAt === undefined
            ? undefined
            : dto.expiresAt
              ? new Date(dto.expiresAt)
              : null,
      },
    });
    return this.serialize(coupon);
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted successfully' };
  }

  async validate(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return { valid: false, message: 'Coupon not found or inactive' };
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return { valid: false, message: 'Coupon is not active yet' };
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return { valid: false, message: 'Coupon has expired' };
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }
    if (
      coupon.minOrderValue != null &&
      subtotal < Number(coupon.minOrderValue)
    ) {
      return {
        valid: false,
        message: `Minimum order value is ${Number(coupon.minOrderValue)}`,
      };
    }

    let discount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);

    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, Number(coupon.maxDiscount));
    }
    discount = Math.min(discount, subtotal);
    discount = Math.round(discount * 100) / 100;

    return {
      valid: true,
      discount,
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
    };
  }

  private async ensureExists(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  private serialize(coupon: {
    id: string;
    code: string;
    type: string;
    description: string | null;
    value: { toString(): string } | number;
    minOrderValue: { toString(): string } | number | null;
    maxDiscount: { toString(): string } | number | null;
    maxUses: number | null;
    usedCount: number;
    startsAt: Date | null;
    expiresAt: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...coupon,
      value: Number(coupon.value),
      minOrderValue:
        coupon.minOrderValue == null ? null : Number(coupon.minOrderValue),
      maxDiscount:
        coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
    };
  }
}
