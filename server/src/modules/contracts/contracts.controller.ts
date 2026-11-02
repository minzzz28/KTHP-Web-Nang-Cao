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
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateContractDto } from './dto/create-contract.dto';
import { ListContractsQueryDto } from './dto/list-contracts-query.dto';
import { TransitionContractDto } from './dto/transition-contract.dto';
import { ContractsService } from './contracts.service';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListContractsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.contractsService.list(user, query)),
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateContractDto,
  ) {
    return {
      success: true,
      message: 'Đã tạo hợp đồng nháp',
      data: await this.contractsService.create(user, input),
    };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('contractId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.contractsService.getForUser(user, id),
    };
  }

  @Post(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('contractId')) id: number,
    @Body() input: TransitionContractDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật trạng thái hợp đồng',
      data: await this.contractsService.transition(user, id, input),
    };
  }

  /** Retains the legacy PATCH route used by earlier clients. */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async transitionLegacy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('contractId')) id: number,
    @Body() input: TransitionContractDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật trạng thái hợp đồng',
      data: await this.contractsService.transition(user, id, input),
    };
  }
}
