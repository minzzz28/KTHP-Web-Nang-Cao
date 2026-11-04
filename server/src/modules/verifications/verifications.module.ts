import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification, StudentProfile, User, VerificationRequest } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Notification, StudentProfile, User, VerificationRequest])],
  controllers: [VerificationsController],
  providers: [VerificationsService],
})
export class VerificationsModule {}
