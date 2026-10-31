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
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadedFiles } from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRoomDto } from './dto/create-room.dto';
import { ListRoomsQueryDto } from './dto/list-rooms-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { roomImageUploadOptions, type UploadedRoomImage } from './room-image-upload';
import { RoomsService } from './rooms.service';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async list(@Query() query: ListRoomsQueryDto) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roomsService.list(query)),
    };
  }

  // The existing client calls this legacy alias from the search and map pages.
  @Get('search')
  async search(@Query() query: ListRoomsQueryDto) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roomsService.list(query)),
    };
  }

  @Get('nearby')
  async nearby(@Query() query: ListRoomsQueryDto) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roomsService.list(query)),
    };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListRoomsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.roomsService.mine(user, query)),
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateRoomDto,
  ) {
    return {
      success: true,
      message: 'Đã tạo phòng',
      data: await this.roomsService.create(user, input),
    };
  }

  @Post(':id/images/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('images', 8, roomImageUploadOptions))
  @HttpCode(HttpStatus.CREATED)
  async uploadImages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('roomId')) id: number,
    @UploadedFiles() files: UploadedRoomImage[] = [],
  ) {
    return {
      success: true,
      message: 'Đã tải ảnh phòng lên',
      data: { items: await this.roomsService.uploadImages(user, id, files) },
    };
  }

  @Get(':id/price-history')
  async priceHistory(
    @Param('id', new ParsePositiveIntPipe('roomId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: { items: await this.roomsService.priceHistory(id) },
    };
  }

  @Get(':id/nearby-places')
  async nearbyPlaces(
    @Param('id', new ParsePositiveIntPipe('roomId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: { items: await this.roomsService.nearbyPlaces(id) },
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('roomId')) id: number,
    @Body() input: UpdateRoomDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật phòng',
      data: await this.roomsService.update(user, id, input),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async hide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('roomId')) id: number,
  ) {
    return {
      success: true,
      message: 'Đã ẩn phòng',
      data: await this.roomsService.hide(user, id),
    };
  }

  @Get(':id')
  async show(
    @Param('id', new ParsePositiveIntPipe('roomId')) id: number,
    @Query() query: ListRoomsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.roomsService.findById(id, query.universityId),
    };
  }
}
