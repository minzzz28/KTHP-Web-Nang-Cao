import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRoommateProfileDto } from './dto/create-roommate-profile.dto';
import { ListRoommatesQueryDto } from './dto/list-roommates-query.dto';
import { UpdateRoommateProfileDto } from './dto/update-roommate-profile.dto';
import { RoommatesService } from './roommates.service';

@Controller('roommates')
export class RoommatesController {
  constructor(private readonly roommatesService: RoommatesService) {}

  @Get()
  async list(@Query() query: ListRoommatesQueryDto) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roommatesService.list(query)),
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async mine(@CurrentUser() user: AuthenticatedUser) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.roommatesService.mine(user.id),
    };
  }

  @Post('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateRoommateProfileDto,
  ) {
    return {
      success: true,
      message: 'Đã tạo hồ sơ ở ghép',
      data: await this.roommatesService.create(user.id, input),
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateRoommateProfileDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật hồ sơ ở ghép',
      data: await this.roommatesService.update(user.id, input),
    };
  }
}
