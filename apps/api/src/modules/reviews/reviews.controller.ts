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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  @Public()
  @ApiOperation({ summary: 'List approved reviews for a product' })
  findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  @Post('products/:productId/reviews')
  @ApiOperation({ summary: 'Create a product review' })
  create(
    @CurrentUser() user: { id: string },
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, productId, dto);
  }

  @Patch('reviews/:id')
  @ApiOperation({ summary: 'Update my review' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user.id, id, dto);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete my review' })
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.remove(user.id, id);
  }
}
