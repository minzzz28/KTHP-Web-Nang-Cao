import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDirectConversationCompatibilityDto } from './dto/create-direct-conversation-compatibility.dto';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { MessageContentDto } from './dto/message-content.dto';
import { ConversationsRealtimeGateway } from './conversations.realtime-gateway';
import { ConversationsService } from './conversations.service';

function compatibilityParticipantId(
  input: CreateDirectConversationCompatibilityDto,
): number {
  const participantId =
    input.participantId ?? input.recipientId ?? input.participantIds?.[0];
  if (participantId === undefined) {
    throw new UnprocessableEntityException('Cần chọn đúng một người nhận');
  }
  return participantId;
}

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly conversationsRealtime: ConversationsRealtimeGateway,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListConversationsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.conversationsService.list(user.id, query)),
    };
  }

  /** Legacy compatibility endpoint; the client normally uses /direct. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDirectCompatibility(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateDirectConversationCompatibilityDto,
  ) {
    return {
      success: true,
      message: 'Đã mở cuộc trò chuyện',
      data: await this.conversationsService.createDirect(
        user,
        compatibilityParticipantId(input),
      ),
    };
  }

  @Post('direct')
  @HttpCode(HttpStatus.CREATED)
  async createDirect(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateDirectConversationDto,
  ) {
    return {
      success: true,
      message: 'Đã mở cuộc trò chuyện',
      data: await this.conversationsService.createDirect(user, input.participantId),
    };
  }

  @Get(':id')
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('conversationId')) id: number,
  ) {
    return {
      success: true,
      message: 'Thành công',
      data: await this.conversationsService.get(user.id, id),
    };
  }

  @Get(':id/messages')
  async listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('conversationId')) id: number,
    @Query() query: ListConversationsQueryDto,
  ) {
    return {
      success: true,
      message: 'Thành công',
      ...(await this.conversationsService.listMessages(user.id, id, query)),
    };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('conversationId')) id: number,
    @Body() input: MessageContentDto,
  ) {
    const result = await this.conversationsService.send(user, id, input);
    this.conversationsRealtime.publishMessage(result);

    return {
      success: true,
      message: 'Đã gửi tin nhắn',
      data: result.message,
    };
  }

  @Patch(':id/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  async edit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('conversationId')) id: number,
    @Param('messageId', new ParsePositiveIntPipe('messageId')) messageId: number,
    @Body() input: MessageContentDto,
  ) {
    return {
      success: true,
      message: 'Đã sửa tin nhắn',
      data: await this.conversationsService.edit(user, id, messageId, input),
    };
  }

  @Delete(':id/messages/:messageId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParsePositiveIntPipe('conversationId')) id: number,
    @Param('messageId', new ParsePositiveIntPipe('messageId')) messageId: number,
  ) {
    await this.conversationsService.remove(user, id, messageId);
    return { success: true, message: 'Đã xóa tin nhắn', data: null };
  }
}
