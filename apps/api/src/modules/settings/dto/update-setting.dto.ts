import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty()
  @IsString()
  @MaxLength(5000)
  value: string;
}
