import { Controller, Get, Param, Patch, Query, UseGuards, Body } from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { SetPropertyVerificationDto } from './dto/set-property-verification.dto';
import { SetRoomStatusDto } from './dto/set-room-status.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@Query() query: ListAdminUsersQueryDto) {
    return { success: true, message: 'Thành công', ...(await this.adminService.listUsers(query)) };
  }

  @Patch('users/:id/status')
  async setUserStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('userId')) id: number,
    @Body() input: SetUserStatusDto,
  ) {
    return { success: true, message: 'Đã cập nhật trạng thái tài khoản', data: await this.adminService.setUserStatus(user, id, input) };
  }

  @Patch('rooms/:id/status')
  async setRoomStatus(@Param('id', new ParsePositiveIntPipe('roomId')) id: number, @Body() input: SetRoomStatusDto) {
    return { success: true, message: 'Đã cập nhật trạng thái phòng', data: await this.adminService.setRoomStatus(id, input) };
  }

  @Patch('properties/:id/verification')
  async setPropertyVerification(@Param('id', new ParsePositiveIntPipe('propertyId')) id: number, @Body() input: SetPropertyVerificationDto) {
    return { success: true, message: 'Đã cập nhật xác minh khu trọ', data: await this.adminService.setPropertyVerification(id, input) };
  }
}
