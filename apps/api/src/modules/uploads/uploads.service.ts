import {
  Injectable,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs/promises';
import { configureCloudinary } from '../../config/cloudinary.config';

@Injectable()
export class UploadsService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Soft-configure; real credentials may be placeholders in dev
    try {
      configureCloudinary(this.configService);
    } catch {
      // Cloudinary not configured — upload will fail at call time
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'apexgear',
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      await this.cleanupLocal(file.path);
      throw new BadRequestException('Only JPEG, PNG, and WEBP images are allowed');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      await this.cleanupLocal(file.path);
      throw new BadRequestException('File size must be under 5MB');
    }

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(
        file.path,
        {
          folder,
          resource_type: 'image',
        },
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Cloudinary upload failed';
      throw new BadRequestException(`Image upload failed: ${message}`);
    } finally {
      await this.cleanupLocal(file.path);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    // publicId may be URL-encoded with slashes (apexgear/products/...)
    const decoded = decodeURIComponent(publicId);
    try {
      await cloudinary.uploader.destroy(decoded);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Cloudinary delete failed';
      throw new BadRequestException(`Image delete failed: ${message}`);
    }
  }

  private async cleanupLocal(path?: string) {
    if (!path) return;
    try {
      await fs.unlink(path);
    } catch {
      // ignore missing file
    }
  }
}
