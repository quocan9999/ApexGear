import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ReviewStatus } from '../../common/enums';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async findByProduct(productId: string, query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const where = {
      productId,
      status: ReviewStatus.APPROVED,
    };

    const [data, total, agg] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        averageRating: agg._avg.rating
          ? Math.round(agg._avg.rating * 10) / 10
          : null,
      },
    };
  }

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, isActive: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) {
      throw new ConflictException('You already reviewed this product');
    }

    return this.prisma.review.create({
      data: {
        productId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
        status: ReviewStatus.PENDING,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) {
      throw new ForbiddenException('Not your review');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        ...dto,
        // Re-moderation after edit
        status: ReviewStatus.PENDING,
      },
    });
  }

  async remove(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) {
      throw new ForbiddenException('Not your review');
    }
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted successfully' };
  }

  async findAll(
    query: PaginationQueryDto & { status?: ReviewStatus; productId?: string },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: { status?: string; productId?: string } = {};
    if (query.status) where.status = query.status;
    if (query.productId) where.productId = query.productId;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async updateStatus(id: string, dto: UpdateReviewStatusDto) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (
      dto.status !== ReviewStatus.APPROVED &&
      dto.status !== ReviewStatus.REJECTED
    ) {
      throw new BadRequestException('Status must be APPROVED or REJECTED');
    }
    return this.prisma.review.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
