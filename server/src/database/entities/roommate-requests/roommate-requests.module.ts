import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Notification,
  Room,
  RoommatePost,
  RoommateRequest,
  User,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RoommateRequestsController } from './roommate-requests.controller';
import { RoommateRequestsService } from './roommate-requests.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      RoommateRequest,
      User,
      RoommatePost,
      Room,
      Notification,
    ]),
  ],
  controllers: [RoommateRequestsController],
  providers: [RoommateRequestsService],
})
export class RoommateRequestsModule {}
