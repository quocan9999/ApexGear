import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReviewsService } from './reviews.service';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../../common/decorators';
import { Role, ReviewStatus } from '../../common/enums';

class AdminReviewQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatus })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;
}

@ApiTags('Admin Reviews')
@Controller('admin/reviews')
@Roles(Role.ADMIN, Role.CONTENT_MANAGER)
export class AdminReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews (admin)' })
  findAll(@Query() query: AdminReviewQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve or reject a review' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(id, dto);
  }
}
