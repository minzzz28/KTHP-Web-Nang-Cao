import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRoommatePostDto } from './dto/create-roommate-post.dto';
import { ListRoommatePostsQueryDto } from './dto/list-roommate-posts-query.dto';
import { UpdateRoommatePostDto } from './dto/update-roommate-post.dto';
import { RoommatePostsService } from './roommate-posts.service';

@Controller('roommate-posts')
export class RoommatePostsController {
  constructor(private readonly roommatePostsService: RoommatePostsService) {}

  @Get()
  async list(@Query() query: ListRoommatePostsQueryDto) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roommatePostsService.list(query)),
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRoommatePostsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roommatePostsService.mine(user.id, query)),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() input: CreateRoommatePostDto) {
    return { success: true, message: 'Đã tạo bài đăng', data: await this.roommatePostsService.create(user, input) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('postId')) id: number,
    @Body() input: UpdateRoommatePostDto,
  ) {
    return { success: true, message: 'Đã cập nhật bài đăng', data: await this.roommatePostsService.update(user, id, input) };
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async close(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParsePositiveIntPipe('postId')) id: number) {
    return { success: true, message: 'Đã đóng bài đăng', data: await this.roommatePostsService.close(user, id) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async archive(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParsePositiveIntPipe('postId')) id: number) {
    return { success: true, message: 'Đã ẩn bài đăng', data: await this.roommatePostsService.archive(user, id) };
  }

  @Get(':id')
  async show(@Param('id', new ParsePositiveIntPipe('postId')) id: number) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.roommatePostsService.findById(id),
    };
  }
}
