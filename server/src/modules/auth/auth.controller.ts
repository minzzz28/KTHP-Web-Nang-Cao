import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  clearAuthenticationCookies,
  destroySession,
  regenerateSession,
  setAccessTokenCookie,
} from '../../common/auth/auth-session';
import { createCsrfToken } from '../../common/auth/csrf';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthenticatedUser } from './auth.types';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() input: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(input);
    return {
      success: true,
      message: 'Đăng ký thành công',
      data: await this.createBrowserSession(request, response, result),
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(input);
    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: await this.createBrowserSession(request, response, result),
    };
  }

  @Get('csrf-token')
  @HttpCode(HttpStatus.OK)
  csrfToken(@Req() request: Request) {
    return {
      success: true,
      message: 'Thành công',
      data: { csrfToken: createCsrfToken(request) },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await destroySession(request);
    clearAuthenticationCookies(response, this.configService);
    return {
      success: true,
      message: 'Đăng xuất thành công.',
      data: null,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.authService.getMe(user.id),
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, input);
    return { success: true, message: 'Đổi mật khẩu thành công', data: null };
  }

  private async createBrowserSession(
    request: Request,
    response: Response,
    result: Awaited<ReturnType<AuthService['login']>>,
  ) {
    await regenerateSession(request);
    request.session.userId = result.user.id;
    setAccessTokenCookie(response, result.accessToken, this.configService);

    return {
      ...result,
      csrfToken: createCsrfToken(request),
    };
  }
}
