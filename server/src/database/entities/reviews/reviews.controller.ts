import {
  Body,
  Controller,
  Delete,
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
import { ReviewStatus, UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Public listings only return reviews that have already been published.
   * Moderation and authoring remain deliberately separate write operations.
   */
  @Get()
  async list(@Query() query: ListReviewsQueryDto) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.reviewsService.list(query)),
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListReviewsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.reviewsService.mine(user, query)),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateReviewDto,
  ) {
    return {
      success: true,
      message: 'Đã gửi đánh giá',
      data: await this.reviewsService.create(user, input),
    };
  }

  @Patch(':id/moderation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async moderate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('reviewId')) id: number,
    @Body() input: ModerateReviewDto,
  ) {
    return {
      success: true,
      message:
        input.status === ReviewStatus.PUBLISHED
          ? 'Đánh giá đã được hiển thị'
          : 'Đánh giá đã được ẩn',
      data: await this.reviewsService.moderate(user, id, input),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('reviewId')) id: number,
    @Body() input: UpdateReviewDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật đánh giá',
      data: await this.reviewsService.update(user, id, input),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async hide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('reviewId')) id: number,
  ) {
    return {
      success: true,
      message: 'Đã ẩn đánh giá',
      data: await this.reviewsService.hide(user, id),
    };
  }
}
