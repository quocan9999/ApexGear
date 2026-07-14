import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsService } from './uploads.service';

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    config: jest.fn(),
  },
}));

jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
}));

import { v2 as cloudinary } from 'cloudinary';

describe('UploadsService', () => {
  let service: UploadsService;
  const config = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'c',
        CLOUDINARY_API_KEY: 'k',
        CLOUDINARY_API_SECRET: 's',
      };
      return map[key];
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UploadsService(config as unknown as ConfigService);
  });

  it('rejects missing file', async () => {
    await expect(service.uploadImage(undefined as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects non-image mimetype', async () => {
    await expect(
      service.uploadImage({
        path: '/tmp/a',
        mimetype: 'application/pdf',
        size: 100,
      } as Express.Multer.File),
    ).rejects.toThrow(/JPEG, PNG, and WEBP/);
  });

  it('rejects files over 5MB', async () => {
    await expect(
      service.uploadImage({
        path: '/tmp/a',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024,
      } as Express.Multer.File),
    ).rejects.toThrow(/5MB/);
  });

  it('uploads valid image and returns url/publicId', async () => {
    (cloudinary.uploader.upload as jest.Mock).mockResolvedValue({
      secure_url: 'https://cdn/x.jpg',
      public_id: 'apexgear/x',
    });

    const result = await service.uploadImage({
      path: '/tmp/a',
      mimetype: 'image/png',
      size: 1024,
    } as Express.Multer.File);

    expect(result).toEqual({
      url: 'https://cdn/x.jpg',
      publicId: 'apexgear/x',
    });
  });

  it('deleteImage decodes publicId and destroys', async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });
    await service.deleteImage(encodeURIComponent('apexgear/products/x'));
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
      'apexgear/products/x',
    );
  });
});
