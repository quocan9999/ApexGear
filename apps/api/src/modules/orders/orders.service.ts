import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { CouponsService } from '../coupons/coupons.service';
import { EmailService } from '../../common/services/email.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enums';
import { randomBytes } from 'crypto';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

const orderInclude = {
  items: true,
  coupon: true,
  user: { select: { id: true, email: true, name: true } },
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private couponsService: CouponsService,
    private emailService: EmailService,
  ) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Validate stock (re-fetch variants for full fields + active product)
    for (const item of cart.items) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: item.variantId,
          isActive: true,
          deletedAt: null,
          product: { isActive: true, deletedAt: null },
        },
      });
      if (!variant) {
        throw new BadRequestException(
          `Variant ${item.variant.name} is no longer available`,
        );
      }
      if (variant.stockAvailable < item.quantity) {
        throw new BadRequestException(
          `Only ${variant.stockAvailable} available for ${item.variant.name}`,
        );
      }
    }

    // Subtotal from cart (use sale price if present on product, else base, else variant price)
    let subtotal = 0;
    const lineItems = cart.items.map((item) => {
      const product = item.variant.product;
      const unit =
        item.variant.price != null
          ? Number(item.variant.price)
          : product.salePrice != null
            ? Number(product.salePrice)
            : Number(product.basePrice);
      subtotal += unit * item.quantity;
      return {
        variantId: item.variantId,
        productName: product.name,
        variantInfo: item.variant.name,
        price: unit,
        quantity: item.quantity,
      };
    });
    subtotal = Math.round(subtotal * 100) / 100;

    let discount = 0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const result = await this.couponsService.validate(
        dto.couponCode,
        subtotal,
      );
      if (!result.valid) {
        throw new BadRequestException(result.message || 'Invalid coupon');
      }
      discount = result.discount ?? 0;
      couponId = result.couponId ?? null;
    }

    const shippingFeeSetting = await this.prisma.setting.findUnique({
      where: { key: 'shipping_fee' },
    });
    const shippingFee = shippingFeeSetting
      ? Number(shippingFeeSetting.value) || 0
      : 30000;

    const total = Math.max(
      0,
      Math.round((subtotal + shippingFee - discount) * 100) / 100,
    );

    const orderNumber = await this.generateOrderNumber();
    const sepayRef =
      dto.paymentMethod === PaymentMethod.SEPAY
        ? `AG${randomBytes(6).toString('hex').toUpperCase()}`
        : null;

    const order = await this.prisma.$transaction(async (tx) => {
      // Deduct stock
      for (const item of cart.items) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            stockAvailable: { gte: item.quantity },
          },
          data: { stockAvailable: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for ${item.variant.name}`,
          );
        }
      }

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.UNPAID,
          subtotal,
          shippingFee,
          discount,
          total,
          shippingName: address.name,
          shippingPhone: address.phone,
          shippingAddress: address.detail,
          shippingWard: address.wardName,
          shippingProvince: address.provinceName,
          couponId,
          sepayRef,
          note: dto.note,
          items: {
            create: lineItems,
          },
        },
        include: orderInclude,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return created;
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await this.emailService.sendOrderConfirmation(user.email, user.name, {
        orderNumber: order.orderNumber,
        total: Number(order.total),
        paymentMethod: order.paymentMethod,
      });
    }

    return this.serialize(order);
  }

  async findUserOrders(userId: string, query: QueryOrderDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: {
      userId: string;
      status?: string;
      paymentStatus?: string;
    } = { userId };
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((o) => this.serialize(o)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findUserOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serialize(order);
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only PENDING orders can be cancelled');
    }

    const updated = await this.cancelWithStockRestore(
      order,
      'Cancelled by customer',
    );
    return this.serialize(updated);
  }

  async findAllOrders(query: QueryOrderDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { shippingName: { contains: query.search } },
        { shippingPhone: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map((o) => this.serialize(o)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findAdminOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serialize(order);
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    this.validateTransition(order.status, dto.status);

    if (
      dto.status === OrderStatus.CANCELLED ||
      dto.status === OrderStatus.REFUNDED
    ) {
      const updated = await this.cancelWithStockRestore(
        order,
        dto.cancelReason ||
          (dto.status === OrderStatus.REFUNDED
            ? 'Refunded by admin'
            : 'Cancelled by admin'),
        dto.status,
      );
      return this.serialize(updated);
    }

    const timestamps: Record<string, Date | string | undefined> = {};
    if (dto.status === OrderStatus.CONFIRMED) timestamps.confirmedAt = new Date();
    if (dto.status === OrderStatus.SHIPPING) timestamps.shippedAt = new Date();
    if (dto.status === OrderStatus.DELIVERED) {
      timestamps.deliveredAt = new Date();
    }
    if (dto.status === OrderStatus.COMPLETED) {
      timestamps.completedAt = new Date();
      timestamps.paymentStatus = PaymentStatus.PAID;
      if (!order.paidAt) timestamps.paidAt = new Date();
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status, ...timestamps },
      include: orderInclude,
    });

    if (dto.status === OrderStatus.DELIVERED && order.user) {
      await this.emailService.sendDeliveryConfirmation(
        order.user.email,
        order.user.name,
        { orderNumber: order.orderNumber },
      );
    }

    return this.serialize(updated);
  }

  validateTransition(from: string, to: string) {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Cannot transition order from ${from} to ${to}`,
      );
    }
  }

  async cancelWithStockRestore(
    order: {
      id: string;
      status: string;
      items: { variantId: string; quantity: number }[];
    },
    cancelReason: string,
    status: string = OrderStatus.CANCELLED,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          cancelledAt: new Date(),
          cancelReason,
          ...(status === OrderStatus.REFUNDED
            ? { paymentStatus: PaymentStatus.REFUNDED }
            : {}),
        },
        include: orderInclude,
      });

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockAvailable: { increment: item.quantity } },
        });
      }

      return updated;
    });
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const prefix = `AG-${y}${m}${d}-`;
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}${suffix}`;
  }

  private serialize(order: any) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discount: Number(order.discount),
      total: Number(order.total),
      items: order.items?.map((item: any) => ({
        ...item,
        price: Number(item.price),
      })),
      coupon: order.coupon
        ? {
            ...order.coupon,
            value: Number(order.coupon.value),
            minOrderValue:
              order.coupon.minOrderValue == null
                ? null
                : Number(order.coupon.minOrderValue),
            maxDiscount:
              order.coupon.maxDiscount == null
                ? null
                : Number(order.coupon.maxDiscount),
          }
        : order.coupon,
    };
  }
}
