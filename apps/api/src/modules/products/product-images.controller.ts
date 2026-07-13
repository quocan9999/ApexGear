import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Role } from '../../common/enums';
import { ProductImagesService } from './product-images.service';
import { Public, Roles } from '../../common/decorators';

@ApiTags('Product Images')
@Controller('products/:productId/images')
export class ProductImagesController {
  constructor(private productImagesService: ProductImagesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List product images' })
  findAll(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productImagesService.findByProduct(productId);
  }

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Upload a product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        alt: { type: 'string' },
        isPrimary: { type: 'boolean' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Only JPEG, PNG, and WEBP images are allowed',
            ) as Error,
            false,
          );
        }
      },
    }),
  )
  upload(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { alt?: string; isPrimary?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const isPrimary =
      body.isPrimary === 'true' || (body.isPrimary as unknown) === true;
    return this.productImagesService.upload(productId, file, {
      alt: body.alt,
      isPrimary,
    });
  }

  // Static path BEFORE parameterized routes
  @Patch('reorder')
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Reorder product images' })
  reorder(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: { imageIds: string[] },
  ) {
    if (!body.imageIds || !Array.isArray(body.imageIds)) {
      throw new BadRequestException('imageIds array is required');
    }
    return this.productImagesService.reorder(productId, body.imageIds);
  }

  @Patch(':imageId/primary')
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Set image as primary' })
  setPrimary(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productImagesService.setPrimary(productId, imageId);
  }

  @Delete(':imageId')
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete a product image' })
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.productImagesService.remove(productId, imageId);
  }
}
