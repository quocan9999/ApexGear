import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProductImagesService {
  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

  async findByProduct(productId: string) {
    await this.ensureProduct(productId);
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upload(
    productId: string,
    file: Express.Multer.File,
    options?: { alt?: string; isPrimary?: boolean },
  ) {
    await this.ensureProduct(productId);

    const { url, publicId } = await this.uploadsService.uploadImage(
      file,
      `apexgear/products/${productId}`,
    );

    const isPrimary = options?.isPrimary ?? false;

    if (isPrimary) {
      await this.prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const maxSort = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { sortOrder: true },
    });

    return this.prisma.productImage.create({
      data: {
        productId,
        url,
        publicId,
        alt: options?.alt,
        isPrimary,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async setPrimary(productId: string, imageId: string) {
    await this.ensureImage(productId, imageId);

    await this.prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });

    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  async reorder(productId: string, imageIds: string[]) {
    await this.ensureProduct(productId);

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.productImage.updateMany({
          where: { id, productId },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.findByProduct(productId);
  }

  async remove(productId: string, imageId: string) {
    const image = await this.ensureImage(productId, imageId);

    // Best-effort Cloudinary cleanup
    try {
      await this.uploadsService.deleteImage(image.publicId);
    } catch {
      // continue even if Cloudinary delete fails
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { message: 'Image deleted successfully' };
  }

  private async ensureProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return product;
  }

  private async ensureImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }
    return image;
  }
}
