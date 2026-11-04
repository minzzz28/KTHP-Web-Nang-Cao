import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Conversation,
  ConversationMember,
  Message,
  Notification,
  User,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsRealtimeGateway } from './conversations.realtime-gateway';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Conversation,
      ConversationMember,
      Message,
      Notification,
      User,
    ]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsRealtimeGateway],
  exports: [ConversationsRealtimeGateway],
})
export class ConversationsModule {}
