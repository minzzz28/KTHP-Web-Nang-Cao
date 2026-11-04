import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Contract,
  Favorite,
  Invoice,
  Property,
  Report,
  Room,
  RoommateRequest,
  User,
  VerificationRequest,
  ViewingAppointment,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RoomsModule } from '../rooms/rooms.module';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';

@Module({
  imports: [
    AuthModule,
    RoomsModule,
    TypeOrmModule.forFeature([
      Contract,
      Favorite,
      Invoice,
      Property,
      Report,
      Room,
      RoommateRequest,
      User,
      VerificationRequest,
      ViewingAppointment,
    ]),
  ],
  controllers: [DashboardsController],
  providers: [DashboardsService],
})
export class DashboardsModule {}
