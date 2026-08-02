import { Role, AuthProvider } from '../../../common/enums';
import { User as PrismaUser } from '@prisma/client';

export class UserEntity {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: Role | string;
  provider: AuthProvider | string;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Explicit whitelisting constructor.
   * We do not use Object.assign or @Exclude() here to prevent sensitive fields 
   * (password, googleId, etc.) from leaking into JSON serialization when the 
   * response is wrapped by TransformInterceptor.
   */
  constructor(partial: Partial<PrismaUser>) {
    this.id = partial.id!;
    this.email = partial.email!;
    this.name = partial.name!;
    this.phone = partial.phone ?? null;
    this.avatar = partial.avatar ?? null;
    this.role = partial.role!;
    this.provider = partial.provider!;
    this.emailVerifiedAt = partial.emailVerifiedAt ?? null;
    this.isActive = partial.isActive ?? true;
    this.createdAt = partial.createdAt!;
    this.updatedAt = partial.updatedAt!;
  }
}
