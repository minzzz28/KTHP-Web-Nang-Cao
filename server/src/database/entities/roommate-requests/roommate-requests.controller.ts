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
import {
  RoommateRequestStatus,
  UserRole,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';
import { ListRoommateRequestsQueryDto } from './dto/list-roommate-requests-query.dto';
import {
  RespondRoommateRequestDto,
  RoommateRequestAction,
} from './dto/respond-roommate-request.dto';
import { UpdateRoommateRequestStatusDto } from './dto/update-roommate-request-status.dto';
import { RoommateRequestsService } from './roommate-requests.service';

function legacyStatusAction(
  status: UpdateRoommateRequestStatusDto['status'],
): RoommateRequestAction {
  if (status === RoommateRequestStatus.ACCEPTED) {
    return RoommateRequestAction.ACCEPT;
  }
  if (status === RoommateRequestStatus.REJECTED) {
    return RoommateRequestAction.REJECT;
  }
  return RoommateRequestAction.CANCEL;
}

@Controller('roommate-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class RoommateRequestsController {
  constructor(
    private readonly roommateRequestsService: RoommateRequestsService,
  ) {}

  @Get()
  async listAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRoommateRequestsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roommateRequestsService.listAll(user.id, query)),
    };
  }

  @Get('sent')
  async listSent(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRoommateRequestsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roommateRequestsService.listSent(user.id, query)),
    };
  }

  @Get('received')
  async listReceived(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRoommateRequestsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roommateRequestsService.listReceived(user.id, query)),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateRoommateRequestDto,
  ) {
    return {
      success: true,
      message: 'Đã gửi lời mời ở ghép',
      data: await this.roommateRequestsService.send(user, input),
    };
  }

  @Post(':id/action')
  @HttpCode(HttpStatus.OK)
  async respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('requestId')) id: number,
    @Body() input: RespondRoommateRequestDto,
  ) {
    return {
      success: true,
      message: 'Đã xử lý lời mời ở ghép',
      data: await this.roommateRequestsService.respond(user, id, input.action),
    };
  }

  @Patch(':id')
  async updateLegacyStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('requestId')) id: number,
    @Body() input: UpdateRoommateRequestStatusDto,
  ) {
    return {
      success: true,
      message: 'Đã xử lý lời mời ở ghép',
      data: await this.roommateRequestsService.respond(
        user,
        id,
        legacyStatusAction(input.status),
      ),
    };
  }
}
