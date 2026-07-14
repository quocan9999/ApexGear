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
  @ApiOperation({ summary: 'List VN provinces (proxied + cached)' })
  fetchProvinces() {
    return this.provincesService.fetchProvinces();
  }

  @Get('provinces/:code/districts')
  @Public()
  @ApiOperation({ summary: 'List districts for a province' })
  fetchDistricts(@Param('code') code: string) {
    return this.provincesService.fetchDistricts(code);
  }

  @Get('districts/:code/wards')
  @Public()
  @ApiOperation({ summary: 'List wards for a district' })
  fetchWards(@Param('code') code: string) {
    return this.provincesService.fetchWards(code);
  }
}
