import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

function validateLegacyMarkReadBody(input: unknown): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new UnprocessableEntityException({
      message: 'Dữ liệu gửi lên không hợp lệ',
      errors: [{ field: 'body', message: 'Dữ liệu gửi lên không hợp lệ' }],
    });
  }

  const value = (input as { isRead?: unknown }).isRead;
  if (value !== undefined && value !== true) {
    throw new UnprocessableEntityException({
      message: 'Dữ liệu gửi lên không hợp lệ',
      errors: [{ field: 'isRead', message: 'isRead phải là true' }],
    });
  }
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.notificationsService.list(user.id, query)),
    };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: { count: await this.notificationsService.unreadCount(user.id) },
    };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Đã đánh dấu tất cả đã đọc',
      data: { count: await this.notificationsService.markAllRead(user.id) },
    };
  }

  @Patch('read-all')
  async markAllReadWithPatch(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Đã đánh dấu tất cả đã đọc',
      data: { count: await this.notificationsService.markAllRead(user.id) },
    };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('notificationId')) id: number,
  ) {
    return {
      success: true,
      message: 'Đã đánh dấu đã đọc',
      data: await this.notificationsService.markRead(user.id, id),
    };
  }

  // Legacy alias. Its body is intentionally ignored, as the old Zod schema
  // stripped non-essential fields and only allowed marking an item as read.
  @Patch(':id')
  async markReadLegacyAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('notificationId')) id: number,
    @Body() body: unknown,
  ) {
    validateLegacyMarkReadBody(body);

    return {
      success: true,
      message: 'Đã đánh dấu đã đọc',
      data: await this.notificationsService.markRead(user.id, id),
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('notificationId')) id: number,
  ) {
    await this.notificationsService.remove(user.id, id);
    return { success: true, message: 'Đã xóa thông báo', data: null };
  }
}
