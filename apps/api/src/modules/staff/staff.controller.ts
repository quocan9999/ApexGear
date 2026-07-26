import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../common/enums';
import { StaffService } from './staff.service';
import { QueryStaffDto } from './dto/query-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@ApiTags('Staff')
@Controller('staff')
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  findAll(@Query() query: QueryStaffDto, @CurrentUser() actor: { role: Role }) {
    return this.staffService.findAll(query, actor.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: { role: Role }) {
    return this.staffService.findOne(id, actor.role);
  }

  @Post()
  create(@Body() dto: CreateStaffDto, @CurrentUser() actor: { role: Role }) {
    return this.staffService.create(dto, actor.role);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto, @CurrentUser() actor: { id: string; role: Role }) {
    return this.staffService.update(id, dto, actor.id, actor.role);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: { id: string; role: Role }) {
    return this.staffService.remove(id, actor.id, actor.role);
  }

  @Post(':id/restore')
  restore(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: { role: Role }) {
    return this.staffService.restore(id, actor.role);
  }

  @Post(':id/resend-invite')
  resendInvite(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: { id: string; role: Role }) {
    return this.staffService.resendInvite(id, actor.id, actor.role);
  }
}
