import { Controller, Get, Patch, Post, Body, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { CustomersService } from './customers.service';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateAddressDto } from '../addresses/dto/update-address.dto';

@ApiTags('Customers')
@Controller('customers')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(@Query() query: QueryCustomerDto, @CurrentUser() actor: { role: Role }) {
    return this.customersService.findAll(query, actor.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: { role: Role }) {
    return this.customersService.findOne(id, actor.role);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() actor: { role: Role }) {
    return this.customersService.update(id, dto, actor.role);
  }

  @Post(':id/unlock')
  unlock(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: { role: Role }) {
    return this.customersService.unlock(id, actor.role);
  }

  @Patch(':id/addresses/:addressId')
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() actor: { role: Role },
  ) {
    return this.customersService.updateAddress(id, addressId, dto, actor.role);
  }
}
