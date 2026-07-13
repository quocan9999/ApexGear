import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryInventoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search by product name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;
}
