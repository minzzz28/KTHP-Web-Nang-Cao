import { ConversationsRealtimeGateway } from './conversations.realtime-gateway';

describe('ConversationsRealtimeGateway', () => {
  it('evicts every socket for a removed user before later conversation broadcasts', () => {
    const userSockets = { socketsLeave: jest.fn() };
    const userEmitter = { emit: jest.fn() };
    const conversationEmitter = { emit: jest.fn() };
    const io = {
      in: jest.fn().mockReturnValue(userSockets),
      to: jest
        .fn()
        .mockReturnValueOnce(userEmitter)
        .mockReturnValueOnce(conversationEmitter),
    };
    const gateway = Object.create(
      ConversationsRealtimeGateway.prototype,
    ) as ConversationsRealtimeGateway;
    (gateway as unknown as { io: typeof io }).io = io;

    gateway.revokeConversationMembership(8, 91);

    expect(io.in).toHaveBeenCalledWith('user:8');
    expect(userSockets.socketsLeave).toHaveBeenCalledWith('conversation:91');
    expect(io.to).toHaveBeenNthCalledWith(1, 'user:8');
    expect(userEmitter.emit).toHaveBeenCalledWith('conversation:updated', {
      conversationId: 91,
    });
    expect(io.to).toHaveBeenNthCalledWith(2, 'conversation:91');
  });
});
