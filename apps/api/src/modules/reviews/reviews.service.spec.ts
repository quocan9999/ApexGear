import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { ReviewStatus } from '../../common/enums';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ReviewsService(prisma as never);
  });

  describe('create', () => {
    it('throws when product missing', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(
        service.create('u1', 'p1', { rating: 5, comment: 'great' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when user already reviewed', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.review.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(
        service.create('u1', 'p1', { rating: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates review as PENDING', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.review.findUnique.mockResolvedValue(null);
      prisma.review.create.mockResolvedValue({
        id: 'r1',
        status: ReviewStatus.PENDING,
      });

      await service.create('u1', 'p1', { rating: 4, comment: 'ok' });
      expect(prisma.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: ReviewStatus.PENDING,
          rating: 4,
          userId: 'u1',
          productId: 'p1',
        }),
      });
    });
  });

  describe('update', () => {
    it('forbids editing others reviews', async () => {
      prisma.review.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 'other',
      });
      await expect(
        service.update('u1', 'r1', { rating: 3 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('resets status to PENDING after edit', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1' });
      prisma.review.update.mockResolvedValue({});
      await service.update('u1', 'r1', { comment: 'updated' });
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: expect.objectContaining({ status: ReviewStatus.PENDING }),
      });
    });
  });

  describe('updateStatus', () => {
    it('rejects non approve/reject status', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1' });
      await expect(
        service.updateStatus('r1', {
          status: ReviewStatus.PENDING as ReviewStatus.APPROVED,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('approves review', async () => {
      prisma.review.findUnique.mockResolvedValue({ id: 'r1' });
      prisma.review.update.mockResolvedValue({
        id: 'r1',
        status: ReviewStatus.APPROVED,
      });
      await service.updateStatus('r1', { status: ReviewStatus.APPROVED });
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: ReviewStatus.APPROVED },
      });
    });
  });

  describe('findByProduct', () => {
    it('returns approved reviews with averageRating', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.review.findMany.mockResolvedValue([{ id: 'r1', rating: 5 }]);
      prisma.review.count.mockResolvedValue(1);
      prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.55 } });

      const result = await service.findByProduct('p1', {});
      expect(result.meta.averageRating).toBe(4.6);
      expect(result.data).toHaveLength(1);
    });
  });
});
