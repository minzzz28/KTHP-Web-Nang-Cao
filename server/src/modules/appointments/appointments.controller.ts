import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole, ViewingAppointmentStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppointmentActionDto } from './dto/appointment-action.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsService } from './appointments.service';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAppointmentsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.appointmentsService.list(user, query)),
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateAppointmentDto,
  ) {
    return {
      success: true,
      message: 'Đã đặt lịch xem phòng',
      data: await this.appointmentsService.create(user, input),
    };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('appointmentId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.appointmentsService.getForUser(user, id),
    };
  }

  @Post(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('appointmentId')) id: number,
    @Body() input: AppointmentActionDto,
  ) {
    return {
      success: true,
      message: 'Đã phản hồi lịch xem',
      data: await this.appointmentsService.respond(user, id, input),
    };
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('appointmentId')) id: number,
  ) {
    return {
      success: true,
      message: 'Đã hủy lịch xem',
      data: await this.appointmentsService.cancel(user, id),
    };
  }

  /** Legacy PATCH endpoint: CANCELLED remains a student-only cancellation. */
  @Patch(':id')
  async updateLegacy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('appointmentId')) id: number,
    @Body() input: UpdateAppointmentDto,
  ) {
    if (input.status === ViewingAppointmentStatus.CANCELLED) {
      return {
        success: true,
        message: 'Đã hủy lịch xem',
        data: await this.appointmentsService.cancel(user, id),
      };
    }
    return {
      success: true,
      message: 'Đã phản hồi lịch xem',
      data: await this.appointmentsService.respond(user, id, input),
    };
  }
}
