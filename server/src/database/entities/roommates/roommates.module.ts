import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoommateProfile, University } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RoommatesController } from './roommates.controller';
import { RoommatesService } from './roommates.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([RoommateProfile, University]),
  ],
  controllers: [RoommatesController],
  providers: [RoommatesService],
})
export class RoommatesModule {}
