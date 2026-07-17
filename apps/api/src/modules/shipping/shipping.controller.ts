import { Controller, Get, Query } from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('fee')
  async getFee(
    @Query('provinceCode') provinceCode?: string,
    @Query('wardCode') wardCode?: string,
  ) {
    const fee = await this.shippingService.calculateFee(provinceCode, wardCode);
    return { success: true, data: { fee } };
  }
}
