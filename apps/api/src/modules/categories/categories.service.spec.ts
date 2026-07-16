import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CategoriesService(prisma as never);
  });

  describe('findAll', () => {
    it('returns only active parents for public', async () => {
      prisma.category.findMany.mockResolvedValue([]);
      await service.findAll({}, false);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            parentId: null,
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('throws NotFound when missing', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns category', async () => {
      const cat = { id: 'c1', slug: 'tai-nghe', name: 'Tai nghe' };
      prisma.category.findFirst.mockResolvedValue(cat);
      await expect(service.findBySlug('tai-nghe')).resolves.toEqual(cat);
    });
  });

  describe('create', () => {
    it('rejects missing parent', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ name: 'Child', parentId: 'missing' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects nesting under subcategory', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'sub',
        parentId: 'parent',
      });
      await expect(
        service.create({ name: 'Grandchild', parentId: 'sub' }),
      ).rejects.toThrow(/only 2 levels/);
    });

    it('creates with unique slug', async () => {
      prisma.category.findFirst.mockResolvedValue(null); // uniqueSlug
      prisma.category.create.mockResolvedValue({
        id: 'c1',
        name: 'Tai nghe',
        slug: 'tai-nghe',
      });

      const result = await service.create({ name: 'Tai nghe' });
      expect(result.slug).toBe('tai-nghe');
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'tai-nghe' }),
        }),
      );
    });

  });

  describe('remove', () => {
    it('rejects delete when products exist', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'c1',
        _count: { products: 2, children: 0 },
      });
      await expect(service.remove('c1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('soft-deletes category and children', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'c1',
        _count: { products: 0, children: 1 },
      });
      prisma.category.updateMany.mockResolvedValue({ count: 1 });
      prisma.category.update.mockResolvedValue({ id: 'c1', deletedAt: new Date() });

      await service.remove('c1');
      expect(prisma.category.updateMany).toHaveBeenCalled();
      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
