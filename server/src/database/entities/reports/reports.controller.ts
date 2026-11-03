import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ProcessReportDto } from './dto/process-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListReportsQueryDto) {
    return { success: true, message: 'Thành công', ...(await this.reportsService.list(user, query)) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateReportDto) {
    return { success: true, message: 'Đã gửi báo cáo', data: await this.reportsService.create(user, input) };
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParsePositiveIntPipe('reportId')) id: number) {
    return { success: true, message: 'Thành công', data: await this.reportsService.getForUser(user, id) };
  }

  @Patch(':id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async process(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('reportId')) id: number,
    @Body() input: ProcessReportDto,
  ) {
    return { success: true, message: 'Đã cập nhật báo cáo', data: await this.reportsService.process(user, id, input) };
  }
}
