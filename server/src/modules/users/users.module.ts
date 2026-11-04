import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LandlordProfile,
  StudentProfile,
  University,
  User,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, StudentProfile, LandlordProfile, University]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
