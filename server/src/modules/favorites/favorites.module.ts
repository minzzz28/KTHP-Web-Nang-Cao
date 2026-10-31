import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite, Room } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Favorite, Room])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
