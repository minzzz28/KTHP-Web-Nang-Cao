import {
  MessageType,
  UserRole,
  UserStatus,
} from '../../database/enums/domain.enums';
import { ConversationsController } from './conversations.controller';
import { ConversationsRealtimeGateway } from './conversations.realtime-gateway';
import {
  ConversationsService,
  SentMessageResult,
} from './conversations.service';

describe('ConversationsController', () => {
  it('publishes a REST-created message only after the service returns it', async () => {
    const result: SentMessageResult = {
      conversationId: 42,
      recipientIds: [8],
      message: {
        id: 81,
        conversationId: 42,
        senderId: 7,
        content: 'Xin chào',
        type: MessageType.TEXT,
        sentAt: new Date('2026-01-01T00:00:00.000Z'),
        editedAt: null,
        isDeleted: false,
        sender: null,
      },
    };
    const conversationsService = { send: jest.fn().mockResolvedValue(result) };
    const conversationsRealtime = { publishMessage: jest.fn() };
    const controller = new ConversationsController(
      conversationsService as unknown as ConversationsService,
      conversationsRealtime as unknown as ConversationsRealtimeGateway,
    );

    const response = await controller.send(
      {
        id: 7,
        username: 'student-7',
        email: 'private@example.com',
        fullName: 'Người gửi',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
      42,
      { content: 'Xin chào' },
    );

    expect(conversationsRealtime.publishMessage).toHaveBeenCalledWith(result);
    expect(response).toEqual(
      expect.objectContaining({ success: true, data: result.message }),
    );
  });
});
