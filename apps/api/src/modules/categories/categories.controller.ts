import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { UserEntity } from '../auth/entities/user.entity';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List categories as tree (parents with children)' })
  findAll(
    @Query() query: QueryCategoryDto,
    @CurrentUser() user?: UserEntity,
  ) {
    const isStaff =
      !!user &&
      [
        Role.ADMIN,
        Role.CONTENT_MANAGER,
        Role.INVENTORY_MANAGER,
        Role.ORDER_MANAGER,
      ].includes(user.role);
    return this.categoriesService.findAll(query, isStaff);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get category by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Post()
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a category' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.CONTENT_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a category' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Soft-delete a category' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
