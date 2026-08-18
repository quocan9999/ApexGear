import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { StaffService } from '../staff/staff.service';
import { UserEntity } from './entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private staffService: StaffService,
  ) {}

  private getAccessTokenCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: 'lax' | 'strict' | 'none' =
      (process.env.COOKIE_SAME_SITE as any) ||
      (process.env.COOKIE_DOMAIN ? 'lax' : isProd ? 'none' : 'lax');
    return {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    };
  }

  private getRefreshTokenCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite: 'lax' | 'strict' | 'none' =
      (process.env.COOKIE_SAME_SITE as any) ||
      (process.env.COOKIE_DOMAIN ? 'lax' : isProd ? 'none' : 'lax');
    return {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain: process.env.COOKIE_DOMAIN || undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh',
    };
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new customer account' })
  async register(@Body() dto: RegisterDto) {
    await this.authService.register(dto);
    return {
      message:
        'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
    };
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto);
    return { message: 'Xác minh email thành công' };
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendVerification(dto);
    return { message: 'Nếu email cần xác minh, một email mới đã được gửi' };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  // Login has its own failed-attempt IP throttle in AuthService. Skip the
  // global request throttle here so a correct password is never blocked by
  // prior incorrect attempts from the same IP.
  @SkipThrottle()
  @ApiOperation({ summary: 'Login and set JWT cookie' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const { user, accessToken, refreshToken } = await this.authService.login(dto, ip);
    res.cookie('accessToken', accessToken, this.getAccessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, this.getRefreshTokenCookieOptions());
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear JWT cookies' })
  async logout(@Res({ passthrough: true }) res: Response) {
    const accessOpts = this.getAccessTokenCookieOptions();
    const refreshOpts = this.getRefreshTokenCookieOptions();
    res.clearCookie('accessToken', {
      httpOnly: accessOpts.httpOnly,
      secure: accessOpts.secure,
      sameSite: accessOpts.sameSite,
      domain: accessOpts.domain,
      path: accessOpts.path,
    });
    res.clearCookie('refreshToken', {
      httpOnly: refreshOpts.httpOnly,
      secure: refreshOpts.secure,
      sameSite: refreshOpts.sameSite,
      domain: refreshOpts.domain,
      path: refreshOpts.path,
    });
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    
    const payload = await this.authService.verifyRefreshToken(refreshToken);
    const user = await this.authService.getProfile(payload.sub);
    const accessToken = this.authService.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    res.cookie('accessToken', accessToken, this.getAccessTokenCookieOptions());
    return { message: 'ok' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: UserEntity) {
    return this.authService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update own profile' })
  async updateProfile(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @CurrentUser() user: UserEntity,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto);
    return { message: 'Password changed successfully' };
  }

  @Post('accept-invitation')
  @Public()
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.staffService.acceptInvitation(dto.token, dto);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully' };
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@CurrentUser() googleUser: any, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.googleLogin(googleUser);
    res.cookie('accessToken', accessToken, this.getAccessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, this.getRefreshTokenCookieOptions());
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback`);
  }
}
