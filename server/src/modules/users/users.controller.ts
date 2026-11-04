import { Body, Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.usersService.getOwnProfile(user.id),
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateAccountDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật tài khoản',
      data: await this.usersService.updateAccount(user.id, input),
    };
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, input);
    return { success: true, message: 'Đổi mật khẩu thành công', data: null };
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: Record<string, unknown>,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật hồ sơ',
      data: await this.usersService.updateProfile(user, input),
    };
  }

  @Get(':id')
  async show(@Param('id', new ParsePositiveIntPipe('userId')) id: number) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.usersService.getPublicProfile(id),
    };
  }
}
