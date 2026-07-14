import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function ctx(): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  }

  it('returns true for public routes without calling passport', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('delegates to AuthGuard for protected routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superSpy = jest
      .spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      )
      .mockReturnValue(true as never);

    expect(guard.canActivate(ctx())).toBe(true);
    expect(superSpy).toHaveBeenCalled();
    superSpy.mockRestore();
  });
});
