import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: cartInclude,
      });
    }

    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id: dto.variantId,
        isActive: true,
        deletedAt: null,
        product: { isActive: true, deletedAt: null },
      },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    if (variant.stockAvailable < dto.quantity) {
      throw new BadRequestException(
        `Only ${variant.stockAvailable} items available`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: cart.id, variantId: dto.variantId },
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      if (newQty > variant.stockAvailable) {
        throw new BadRequestException(
          `Only ${variant.stockAvailable} items available (already ${existingItem.quantity} in cart)`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });
    if (!item) throw new NotFoundException('Cart item not found');
    if (dto.quantity > item.variant.stockAvailable) {
      throw new BadRequestException(
        `Only ${item.variant.stockAvailable} items available`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  }

  async mergeCart(userId: string, dto: MergeCartDto) {
    const cart = await this.getOrCreateCart(userId);

    for (const item of dto.items) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: item.variantId, isActive: true, deletedAt: null },
      });
      if (!variant) continue;

      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_variantId: { cartId: cart.id, variantId: item.variantId },
        },
      });

      const targetQty = existingItem
        ? Math.max(existingItem.quantity, item.quantity)
        : item.quantity;
      const safeQty = Math.min(targetQty, variant.stockAvailable);
      if (safeQty <= 0) continue;

      if (existingItem) {
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: safeQty },
        });
      } else {
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            variantId: item.variantId,
            quantity: safeQty,
          },
        });
      }
    }

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }
}
