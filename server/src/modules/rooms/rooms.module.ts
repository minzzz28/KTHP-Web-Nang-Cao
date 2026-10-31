import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Amenity,
  Contract,
  ContractTenant,
  Favorite,
  NearbyPlace,
  Notification,
  Property,
  Room,
  RoomAmenity,
  RoomImage,
  RoomPriceHistory,
  University,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Amenity,
      Contract,
      ContractTenant,
      Favorite,
      NearbyPlace,
      Notification,
      Property,
      Room,
      RoomAmenity,
      RoomImage,
      RoomPriceHistory,
      University,
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
