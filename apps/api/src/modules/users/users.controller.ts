import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '../../common/enums';
import { UsersService } from './users.service';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserEntity } from '../auth/entities/user.entity';

@ApiTags('Users')
@Controller('users')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user role / active status' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: UserEntity,
  ) {
    return this.usersService.update(id, dto, actor.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a user' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: UserEntity,
  ) {
    return this.usersService.remove(id, actor.id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.restore(id);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock a locked user account' })
  unlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unlock(id);
  }
}
