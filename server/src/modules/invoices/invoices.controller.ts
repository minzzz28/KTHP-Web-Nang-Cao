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
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListInvoicesQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.invoicesService.list(user, query)),
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateInvoiceDto,
  ) {
    return {
      success: true,
      message: 'Đã lập hóa đơn',
      data: await this.invoicesService.create(user, input),
    };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('invoiceId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.invoicesService.getForUser(user, id),
    };
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('invoiceId')) id: number,
    @Body() input: UpdateInvoiceStatusDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật hóa đơn',
      data: await this.invoicesService.updateStatus(user, id, input),
    };
  }
}
