import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification, Report, Review, Room, RoommatePost, User } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Notification, Report, Review, Room, RoommatePost, User])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
