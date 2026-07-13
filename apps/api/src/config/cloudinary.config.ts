import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const configureCloudinary = (configService: ConfigService) => {
  cloudinary.config({
    cloud_name: configService.getOrThrow('CLOUDINARY_CLOUD_NAME'),
    api_key: configService.getOrThrow('CLOUDINARY_API_KEY'),
    api_secret: configService.getOrThrow('CLOUDINARY_API_SECRET'),
  });
  return cloudinary;
};
