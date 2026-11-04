import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DashboardsService } from './dashboards.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('students/dashboard')
  @Roles(UserRole.STUDENT)
  async student(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.dashboardsService.student(user),
    };
  }

  @Get('landlords/dashboard')
  @Roles(UserRole.LANDLORD)
  async landlord(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.dashboardsService.landlord(user),
    };
  }

  @Get('admin/dashboard')
  @Roles(UserRole.ADMIN)
  async admin(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.dashboardsService.admin(user),
    };
  }
}
