import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({
    description:
      'Delta applied to both stockTotal and stockAvailable (can be negative)',
    example: 10,
  })
  @IsInt()
  adjustment: number;

  @ApiPropertyOptional({ example: 'Restock from warehouse' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
