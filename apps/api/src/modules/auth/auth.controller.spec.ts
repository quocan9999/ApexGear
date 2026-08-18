import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StaffService } from '../staff/staff.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;
  let staffService: jest.Mocked<Partial<StaffService>>;

  beforeEach(async () => {
    authService = {
      verifyRefreshToken: jest.fn(),
      getProfile: jest.fn(),
      generateAccessToken: jest.fn(),
    };
    staffService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: StaffService, useValue: staffService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('refresh', () => {
    it('throws UnauthorizedException if no refreshToken cookie provided', async () => {
      const req = { cookies: {} } as Request;
      const res = { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;

      await expect(controller.refresh(req, res)).rejects.toThrow(new UnauthorizedException('No refresh token provided'));
    });

    it('throws if refreshToken is invalid (verifyRefreshToken throws)', async () => {
      const req = { cookies: { refreshToken: 'invalid-token' } } as unknown as Request;
      const res = { cookie: jest.fn() } as unknown as Response;

      (authService.verifyRefreshToken as jest.Mock).mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(controller.refresh(req, res)).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
    });

    it('throws if user is deactivated/deleted (getProfile throws)', async () => {
      const req = { cookies: { refreshToken: 'valid-token' } } as unknown as Request;
      const res = { cookie: jest.fn() } as unknown as Response;

      (authService.verifyRefreshToken as jest.Mock).mockResolvedValue({ sub: 'u1' });
      (authService.getProfile as jest.Mock).mockRejectedValue(new UnauthorizedException('User not found or inactive'));

      await expect(controller.refresh(req, res)).rejects.toThrow(new UnauthorizedException('User not found or inactive'));
    });

    it('generates new access token and sets cookie if valid', async () => {
      const req = { cookies: { refreshToken: 'valid-token' } } as unknown as Request;
      const res = { cookie: jest.fn() } as unknown as Response;

      (authService.verifyRefreshToken as jest.Mock).mockResolvedValue({ sub: 'u1' });
      (authService.getProfile as jest.Mock).mockResolvedValue({ id: 'u1', email: 'test@test.com', role: 'USER' } as any);
      (authService.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');

      const result = await controller.refresh(req, res);

      expect(authService.verifyRefreshToken).toHaveBeenCalledWith('valid-token');
      expect(authService.getProfile).toHaveBeenCalledWith('u1');
      expect(authService.generateAccessToken).toHaveBeenCalledWith({ id: 'u1', email: 'test@test.com', role: 'USER' });
      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'new-access-token', expect.any(Object));
      expect(result).toEqual({ message: 'ok' });
    });
  });
});
