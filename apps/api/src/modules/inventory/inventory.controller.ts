import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '../../common/enums';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { Roles } from '../../common/decorators';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @Roles(Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Inventory overview - all variants with stock' })
  overview(@Query() query: QueryInventoryDto) {
    return this.inventoryService.overview(query);
  }

  @Get('low-stock')
  @Roles(Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Variants at or below low-stock threshold' })
  lowStock(@Query() query: QueryInventoryDto) {
    return this.inventoryService.lowStock(query);
  }

  @Get('out-of-stock')
  @Roles(Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Variants with zero available stock' })
  outOfStock(@Query() query: QueryInventoryDto) {
    return this.inventoryService.outOfStock(query);
  }

  @Get('variants/:variantId')
  @Roles(Role.INVENTORY_MANAGER, Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Get stock detail for a variant' })
  findVariant(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.inventoryService.findVariant(variantId);
  }

  @Patch('variants/:variantId/adjust')
  @Roles(Role.INVENTORY_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Adjust stock for a variant' })
  adjustStock(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(variantId, dto);
  }
}
