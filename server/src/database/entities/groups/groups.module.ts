import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Conversation,
  ConversationMember,
  GroupMember,
  Notification,
  RentalGroup,
  Room,
  User,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { GroupsController } from './groups.controller';
import { GroupsListAuthGuard } from './guards/groups-list-auth.guard';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    AuthModule,
    ConversationsModule,
    TypeOrmModule.forFeature([
      RentalGroup,
      GroupMember,
      Conversation,
      ConversationMember,
      Notification,
      Room,
      User,
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsListAuthGuard],
})
export class GroupsModule {}
