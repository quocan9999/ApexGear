import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ASSIGNABLE_STAFF_ROLES } from '@apexgear/shared';
import { Role } from '../../../common/enums';

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_STAFF_ROLES)
  role?: Exclude<Role, Role.CUSTOMER | Role.SUPER_ADMIN>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
