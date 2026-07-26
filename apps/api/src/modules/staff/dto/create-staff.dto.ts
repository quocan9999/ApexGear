import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ASSIGNABLE_STAFF_ROLES } from '@apexgear/shared';
import { Role } from '../../../common/enums';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsIn(ASSIGNABLE_STAFF_ROLES)
  role: Exclude<Role, Role.CUSTOMER | Role.SUPER_ADMIN>;
}
