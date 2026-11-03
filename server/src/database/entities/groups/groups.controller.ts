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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRentalGroupDto } from './dto/create-rental-group.dto';
import { GroupMemberDto } from './dto/group-member.dto';
import { ListRentalGroupsQueryDto } from './dto/list-rental-groups-query.dto';
import { UpdateRentalGroupDto } from './dto/update-rental-group.dto';
import { GroupsListAuthGuard } from './guards/groups-list-auth.guard';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @UseGuards(GroupsListAuthGuard)
  async list(
    @Query() query: ListRentalGroupsQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    const result = query.mine
      ? await this.groupsService.mine(this.requireStudentUser(user).id, query)
      : await this.groupsService.list(query);
    return { success: true, message: 'Thành công', ...result };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRentalGroupsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.groupsService.mine(user.id, query)),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateRentalGroupDto,
  ) {
    return {
      success: true,
      message: 'Đã tạo nhóm thuê trọ',
      data: await this.groupsService.create(user, input),
    };
  }

  @Get(':id')
  async get(@Param('id', new ParsePositiveIntPipe('groupId')) id: number) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.groupsService.get(id),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('groupId')) id: number,
    @Body() input: UpdateRentalGroupDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật nhóm',
      data: await this.groupsService.update(user.id, id, input),
    };
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  async addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('groupId')) id: number,
    @Body() input: GroupMemberDto,
  ) {
    return {
      success: true,
      message: 'Đã thêm thành viên',
      data: await this.groupsService.addMember(user, id, input.studentId),
    };
  }

  @Delete(':id/members/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('groupId')) id: number,
    @Param('studentId', new ParsePositiveIntPipe('studentId')) studentId: number,
  ) {
    await this.groupsService.removeMember(user.id, id, studentId);
    return { success: true, message: 'Đã xóa thành viên', data: null };
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  async leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('groupId')) id: number,
  ) {
    await this.groupsService.leave(user.id, id);
    return { success: true, message: 'Đã rời nhóm thuê trọ', data: null };
  }

  @Post(':id/transfer-leadership')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  async transferLeadership(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('groupId')) id: number,
    @Body() input: GroupMemberDto,
  ) {
    return {
      success: true,
      message: 'Đã chuyển quyền trưởng nhóm',
      data: await this.groupsService.transferLeadership(
        user.id,
        id,
        input.studentId,
      ),
    };
  }

  private requireStudentUser(
    user: AuthenticatedUser | undefined,
  ): AuthenticatedUser {
    // The conditional list guard populates the identity for `mine=true`.
    // Keep this fail-closed in case a future route decorator changes.
    if (!user || user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
    }
    return user;
  }
}
