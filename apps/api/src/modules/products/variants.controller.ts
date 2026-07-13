import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '../../common/enums';
import { VariantsService } from './variants.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { UserEntity } from '../auth/entities/user.entity';

@ApiTags('Product Variants')
@Controller('products/:productId/variants')
export class VariantsController {
  constructor(private variantsService: VariantsService) {}

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
  @ApiOperation({ summary: 'List variants for a product' })
  findAll(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user?: UserEntity,
  ) {
    return this.variantsService.findByProduct(productId, this.isStaff(user));
  }

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a variant' })
  create(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.variantsService.create(productId, dto);
  }

  @Patch(':variantId')
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a variant' })
  update(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantsService.update(productId, variantId, dto);
  }

  @Delete(':variantId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a variant' })
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.variantsService.remove(productId, variantId);
  }
}
