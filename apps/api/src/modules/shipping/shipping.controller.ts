import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { ShippingService } from './shipping.service';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @ApiOperation({ summary: 'Calculate shipping fee based on address' })
  @Get('fee')
  async getFee(
    @Query('provinceCode') provinceCode?: string,
    @Query('wardCode') wardCode?: string,
  ) {
    const fee = await this.shippingService.calculateFee(provinceCode, wardCode);
    return { success: true, data: { fee } };
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all shipping rules (Admin)' })
  @Get('rules')
  async getRules() {
    const rules = await this.shippingService.getRules();
    return { success: true, data: rules };
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a shipping rule (Admin)' })
  @Post('rules')
  async createRule(@Body() dto: { name: string; fee: number; isDefault?: boolean; isActive?: boolean }) {
    const rule = await this.shippingService.createRule(dto);
    return { success: true, data: rule };
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a shipping rule (Admin)' })
  @Put('rules/:id')
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; fee?: number; isDefault?: boolean; isActive?: boolean },
  ) {
    const rule = await this.shippingService.updateRule(id, dto);
    return { success: true, data: rule };
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a shipping rule (Admin)' })
  @Delete('rules/:id')
  async deleteRule(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.shippingService.deleteRule(id);
    return { success: true, data: result };
  }
}
