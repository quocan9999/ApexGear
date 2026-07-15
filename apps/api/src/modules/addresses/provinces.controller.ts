import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProvincesService } from './provinces.service';
import { Public } from '../../common/decorators';

@ApiTags('Provinces')
@Controller()
export class ProvincesController {
  constructor(private provincesService: ProvincesService) {}

  @Get('provinces')
  @Public()
  @ApiOperation({ summary: 'List VN provinces/cities (v2, post-2025 merger)' })
  fetchProvinces() {
    return this.provincesService.fetchProvinces();
  }

  @Get('provinces/:code/wards')
  @Public()
  @ApiOperation({ summary: 'List wards for a province (2-tier, no districts)' })
  fetchWards(@Param('code') code: string) {
    return this.provincesService.fetchWards(code);
  }
}
