import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

class RevenueQueryDto {
  @ApiPropertyOptional({ enum: [7, 30], default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsIn([7, 30])
  days?: number = 7;
}

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.ADMIN, Role.ORDER_MANAGER)
  @ApiOperation({ summary: 'Admin dashboard stats' })
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('revenue')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Revenue by day (7 or 30 days)' })
  getRevenue(@Query() query: RevenueQueryDto) {
    return this.dashboardService.getRevenue(query.days ?? 7);
  }
}
