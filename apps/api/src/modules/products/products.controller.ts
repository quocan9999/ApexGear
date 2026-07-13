import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '../../common/enums';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { UserEntity } from '../auth/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  private isStaff(user?: UserEntity): boolean {
    if (!user) return false;
    return (
      [
        Role.ADMIN,
        Role.CONTENT_MANAGER,
        Role.INVENTORY_MANAGER,
        Role.ORDER_MANAGER,
      ] as string[]
    ).includes(user.role as string);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products with search/filter/pagination' })
  findAll(@Query() query: QueryProductDto, @CurrentUser() user?: UserEntity) {
    return this.productsService.findAll(query, this.isStaff(user));
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get product detail by slug' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: UserEntity) {
    return this.productsService.findBySlug(slug, this.isStaff(user));
  }

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a product (auto-creates default variant)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a product' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
