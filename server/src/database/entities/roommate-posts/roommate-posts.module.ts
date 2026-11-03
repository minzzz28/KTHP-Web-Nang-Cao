import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room, RoommatePost } from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { RoommatePostsController } from './roommate-posts.controller';
import { RoommatePostsService } from './roommate-posts.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Room, RoommatePost])],
  controllers: [RoommatePostsController],
  providers: [RoommatePostsService],
})
export class RoommatePostsModule {}
