import { NotFoundException } from '@nestjs/common';
import { ProductImagesService } from './product-images.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('ProductImagesService', () => {
  let service: ProductImagesService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let uploadsService: {
    uploadImage: jest.Mock;
    deleteImage: jest.Mock;
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    uploadsService = {
      uploadImage: jest.fn().mockResolvedValue({
        url: 'https://cdn/img.jpg',
        publicId: 'apexgear/products/p1/img',
      }),
      deleteImage: jest.fn().mockResolvedValue(undefined),
    };
    service = new ProductImagesService(prisma as never, uploadsService as never);
  });

  it('findByProduct throws when product missing', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.findByProduct('p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('upload creates image and clears previous primary', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.productImage.updateMany.mockResolvedValue({ count: 1 });
    prisma.productImage.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } });
    prisma.productImage.create.mockResolvedValue({
      id: 'i1',
      url: 'https://cdn/img.jpg',
      isPrimary: true,
      sortOrder: 1,
    });

    const file = {
      path: '/tmp/x',
      mimetype: 'image/jpeg',
      size: 100,
    } as Express.Multer.File;

    await service.upload('p1', file, { isPrimary: true });

    expect(uploadsService.uploadImage).toHaveBeenCalled();
    expect(prisma.productImage.updateMany).toHaveBeenCalled();
    expect(prisma.productImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPrimary: true,
          sortOrder: 1,
        }),
      }),
    );
  });

  it('remove deletes image and best-effort cloudinary', async () => {
    prisma.productImage.findFirst.mockResolvedValue({
      id: 'i1',
      productId: 'p1',
      publicId: 'pid',
    });
    prisma.productImage.delete.mockResolvedValue({});

    const result = await service.remove('p1', 'i1');
    expect(uploadsService.deleteImage).toHaveBeenCalledWith('pid');
    expect(result.message).toMatch(/deleted/i);
  });
});
