import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { ListFavoritesQueryDto } from './dto/list-favorites-query.dto';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListFavoritesQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.favoritesService.list(user.id, query)),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateFavoriteDto,
  ) {
    return {
      success: true,
      message: 'Đã thêm phòng yêu thích',
      data: await this.favoritesService.add(user.id, input),
    };
  }

  @Delete(':roomId')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId', new ParsePositiveIntPipe('roomId')) roomId: number,
  ) {
    await this.favoritesService.remove(user.id, roomId);
    return { success: true, message: 'Đã bỏ phòng yêu thích', data: null };
  }
}
