import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Checkout cart into an order' })
  checkout(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.checkout(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my orders' })
  findMine(
    @CurrentUser() user: { id: string },
    @Query() query: QueryOrderDto,
  ) {
    return this.ordersService.findUserOrders(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get my order detail' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.findUserOrder(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel my PENDING order' })
  cancel(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.cancelOrder(user.id, id);
  }
}
