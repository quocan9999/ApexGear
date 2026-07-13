import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { ProductImagesService } from './product-images.service';
import { ProductImagesController } from './product-images.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [
    ProductsController,
    VariantsController,
    ProductImagesController,
  ],
  providers: [ProductsService, VariantsService, ProductImagesService],
  exports: [ProductsService, VariantsService],
})
export class ProductsModule {}
