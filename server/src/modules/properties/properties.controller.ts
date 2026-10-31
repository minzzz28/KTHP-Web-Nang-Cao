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
import { UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateNearbyPlaceDto } from './dto/create-nearby-place.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPropertiesQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.propertiesService.list(user, query)),
    };
  }

  @Post('geocode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async geocode(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: GeocodeAddressDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: { items: await this.propertiesService.geocode(user, input) },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreatePropertyDto,
  ) {
    return {
      success: true,
      message: 'Đã tạo khu trọ',
      data: await this.propertiesService.create(user, input),
    };
  }

  @Get(':id/nearby-places')
  async nearbyPlaces(
    @Param('id', new ParsePositiveIntPipe('propertyId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: { items: await this.propertiesService.nearbyPlaces(id) },
    };
  }

  @Post(':id/nearby-places')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createNearbyPlace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('propertyId')) id: number,
    @Body() input: CreateNearbyPlaceDto,
  ) {
    return {
      success: true,
      message: 'Đã thêm tiện ích xung quanh',
      data: await this.propertiesService.createNearbyPlace(user, id, input),
    };
  }

  @Delete(':id/nearby-places/:placeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async removeNearbyPlace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('propertyId')) id: number,
    @Param('placeId', new ParsePositiveIntPipe('nearbyPlaceId')) placeId: number,
  ) {
    await this.propertiesService.removeNearbyPlace(user, id, placeId);
    return { success: true, message: 'Đã xóa tiện ích xung quanh' };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('propertyId')) id: number,
    @Body() input: UpdatePropertyDto,
  ) {
    return {
      success: true,
      message: 'Đã cập nhật khu trọ',
      data: await this.propertiesService.update(user, id, input),
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('propertyId')) id: number,
  ) {
    await this.propertiesService.remove(user, id);
    return { success: true, message: 'Đã xóa khu trọ' };
  }

  @Get(':id')
  async show(@Param('id', new ParsePositiveIntPipe('propertyId')) id: number) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.propertiesService.findById(id),
    };
  }
}
