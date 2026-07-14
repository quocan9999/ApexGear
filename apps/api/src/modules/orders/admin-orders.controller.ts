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
import { OrdersService } from './orders.service';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Admin Orders')
@Controller('admin/orders')
@Roles(Role.ADMIN, Role.ORDER_MANAGER)
export class AdminOrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List all orders (admin)' })
  findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAllOrders(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order detail (admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findAdminOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (admin)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
