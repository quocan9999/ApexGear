import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../common/decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    try {
      // Always try to authenticate to populate req.user if a token is present
      const canActivate = await super.canActivate(context);
      return canActivate as boolean;
    } catch (err) {
      // If authentication fails (no token or invalid token) but the route is public, allow access
      if (isPublic) {
        return true;
      }
      throw err;
    }
  }
}
