import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { ListVerificationsQueryDto } from './dto/list-verifications-query.dto';
import { ReviewVerificationRequestDto } from './dto/review-verification-request.dto';
import { VerificationsService } from './verifications.service';

@Controller('verifications')
@UseGuards(JwtAuthGuard)
export class VerificationsController {
  constructor(private readonly verificationsService: VerificationsService) {}

  @Get('me')
  async mine(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVerificationsQueryDto) {
    return { success: true, message: 'Thành công', ...(await this.verificationsService.mine(user, query)) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submit(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateVerificationRequestDto) {
    return { success: true, message: 'Đã gửi yêu cầu xác minh', data: await this.verificationsService.submit(user, input) };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVerificationsQueryDto) {
    return { success: true, message: 'Thành công', ...(await this.verificationsService.list(user, query)) };
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('verificationId')) id: number,
    @Body() input: ReviewVerificationRequestDto,
  ) {
    return { success: true, message: 'Đã xử lý xác minh', data: await this.verificationsService.review(user, id, input) };
  }
}
