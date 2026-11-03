import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification, Property, Room, User } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Notification, Property, Room, User])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
