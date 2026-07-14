import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @MaxLength(15)
  @Matches(/^[0-9+\-\s]+$/)
  phone: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10)
  provinceCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  provinceName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10)
  districtCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  districtName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10)
  wardCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  wardName: string;

  @ApiProperty({ example: '123 Nguyễn Huệ' })
  @IsString()
  @MaxLength(500)
  detail: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
