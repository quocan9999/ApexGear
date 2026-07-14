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
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List my shipping addresses' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.addressesService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a shipping address' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shipping address' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping address' })
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.addressesService.remove(user.id, id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  setDefault(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.addressesService.setDefault(user.id, id);
  }
}
