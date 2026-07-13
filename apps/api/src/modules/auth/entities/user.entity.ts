import { Exclude } from 'class-transformer';
import { Role, AuthProvider } from '../../../common/enums';

export class UserEntity {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role | string;
  provider: AuthProvider | string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string | null;

  @Exclude()
  googleId: string | null;

  @Exclude()
  failedLoginAttempts: number;

  @Exclude()
  lockedUntil: Date | null;

  @Exclude()
  tokenVersion: number;

  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
