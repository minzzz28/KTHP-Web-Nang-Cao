import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  Conversation,
  ConversationMember,
  Message,
  Notification,
  User,
} from '../../database/entities';
import {
  ConversationType,
  MessageType,
  NotificationType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { MessageContentDto } from './dto/message-content.dto';
import { ConversationsService } from './conversations.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

function createUser(id: number, fullName = `Người dùng ${id}`): User {
  return {
    id,
    username: `user-${id}`,
    email: `private-${id}@example.com`,
    passwordHash: 'private-password-hash',
    fullName,
    phone: '0900000000',
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    verificationStatus: VerificationStatus.VERIFIED,
    createdAt,
    updatedAt,
  } as User;
}

function createMember(
  userId: number,
  overrides: Partial<ConversationMember> = {},
): ConversationMember {
  return {
    id: userId + 100,
    conversationId: 42,
    userId,
    lastReadAt: null,
    joinedAt: createdAt,
    leftAt: null,
    createdAt,
    updatedAt,
    user: createUser(userId),
    ...overrides,
  } as ConversationMember;
}

function createConversation(
  overrides: Partial<Conversation> = {},
): Conversation {
  return {
    id: 42,
    type: ConversationType.DIRECT,
    title: null,
    directPairKey: '7:8',
    rentalGroupId: null,
    lastMessageAt: null,
    createdAt,
    updatedAt,
    rentalGroup: null,
    members: [createMember(7), createMember(8)],
    messages: [],
    ...overrides,
  } as Conversation;
}

function createMessage(
  overrides: Partial<Message> = {},
): Message {
  return {
    id: 81,
    conversationId: 42,
    senderId: 8,
    content: 'Tin nhắn mẫu',
    type: MessageType.TEXT,
    sentAt: updatedAt,
    editedAt: null,
    isDeleted: false,
    sender: createUser(8),
    ...overrides,
  } as Message;
}

describe('ConversationsService', () => {
  const conversations = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const members = {
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const messages = {
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const users = { findOneBy: jest.fn() };
  const notifications = { create: jest.fn(), save: jest.fn() };
  let transaction: jest.Mock;
  let service: ConversationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    conversations.create.mockImplementation((input: unknown) => input);
    members.create.mockImplementation((input: unknown) => input);
    messages.create.mockImplementation((input: unknown) => input);
    notifications.create.mockImplementation((input: unknown) => input);

    const repositories = new Map<unknown, unknown>([
      [Conversation, conversations],
      [ConversationMember, members],
      [Message, messages],
      [Notification, notifications],
      [User, users],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new ConversationsService(
      conversations as unknown as Repository<Conversation>,
      members as unknown as Repository<ConversationMember>,
      messages as unknown as Repository<Message>,
      users as unknown as Repository<User>,
      { transaction } as unknown as DataSource,
    );
  });

  it('lists only the caller\'s active conversations and presents public members', async () => {
    const conversation = createConversation({
      members: [
        createMember(7),
        createMember(8),
        createMember(9, { leftAt: updatedAt }),
      ],
    });
    members.findAndCount.mockResolvedValue([
      [createMember(7, { conversation })],
      1,
    ]);
    const latestMessageBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([createMessage()]),
    };
    messages.createQueryBuilder.mockReturnValue(latestMessageBuilder);

    const result = await service.list(7, { page: 1, limit: 50 });

    expect(members.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
    const options = members.findAndCount.mock.calls[0][0];
    expect(options.where.userId).toBe(7);
    expect(options.where.leftAt).toBeDefined();
    expect(result.data.items[0].members).toHaveLength(2);
    expect(result.data.items[0].members[0].user).not.toHaveProperty('email');
    expect(result.data.items[0].lastMessage?.sender).not.toHaveProperty(
      'passwordHash',
    );
    expect(latestMessageBuilder.where).toHaveBeenCalledWith(
      'message.conversation_id IN (:...conversationIds)',
      { conversationIds: [42] },
    );
  });

  it('does not disclose a conversation to someone without active membership', async () => {
    members.findOne.mockResolvedValue(null);

    await expect(service.get(9, 42)).rejects.toBeInstanceOf(NotFoundException);

    expect(conversations.findOne).not.toHaveBeenCalled();
  });

  it('creates both direct-chat memberships atomically', async () => {
    users.findOneBy.mockResolvedValue(createUser(8));
    conversations.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    conversations.save.mockResolvedValue(createConversation());
    members.save.mockResolvedValue([]);
    members.findOne.mockResolvedValue(createMember(7));
    conversations.findOne.mockResolvedValue(createConversation());
    messages.findOne.mockResolvedValue(null);

    const result = await service.createDirect(
      { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
      8,
    );

    expect(transaction).toHaveBeenCalledTimes(2);
    expect(conversations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ConversationType.DIRECT,
        directPairKey: '7:8',
      }),
    );
    expect(members.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ userId: 7, leftAt: null }),
        expect.objectContaining({ userId: 8, leftAt: null }),
      ]),
    );
    expect(result.id).toBe(42);
  });

  it('returns the existing direct conversation after a duplicate-key race', async () => {
    const concurrentConversation = createConversation({ id: 77 });
    users.findOneBy.mockResolvedValue(createUser(8));
    conversations.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrentConversation);
    conversations.save.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });
    members.findOne.mockResolvedValue(createMember(7));
    conversations.findOne.mockResolvedValue(concurrentConversation);
    messages.findOne.mockResolvedValue(null);

    await expect(
      service.createDirect(
        { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
        8,
      ),
    ).resolves.toMatchObject({ id: 77, directPairKey: '7:8' });

    expect(members.save).not.toHaveBeenCalled();
  });

  it('does not reopen an existing direct conversation after the caller left it', async () => {
    users.findOneBy.mockResolvedValue(createUser(8));
    conversations.findOneBy.mockResolvedValue(createConversation());
    members.findOne.mockResolvedValue(null);

    await expect(
      service.createDirect(
        { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
        8,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(conversations.findOne).not.toHaveBeenCalled();
  });

  it('returns the newest page in chronological order and marks only the caller as read', async () => {
    const membership = createMember(7);
    const newer = createMessage({ id: 82, sentAt: updatedAt });
    const older = createMessage({ id: 81, sentAt: createdAt });
    members.findOne.mockResolvedValue(membership);
    messages.findAndCount.mockResolvedValue([[newer, older], 2]);
    members.update.mockResolvedValue({ affected: 1 });

    const result = await service.listMessages(7, 42, { page: 1, limit: 50 });

    expect(result.data.items.map((message) => message.id)).toEqual([81, 82]);
    expect(members.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: membership.id, userId: 7, conversationId: 42 }),
      expect.objectContaining({ lastReadAt: updatedAt }),
    );
  });

  it('sends a server-owned text message and notifies only active recipients', async () => {
    const membership = createMember(7);
    const sentMessage = createMessage({ id: 90, senderId: 7, sender: createUser(7) });
    members.findOne.mockResolvedValue(membership);
    conversations.findOne.mockResolvedValue(createConversation());
    messages.save.mockResolvedValue(sentMessage);
    messages.findOne.mockResolvedValue(sentMessage);
    members.find.mockResolvedValue([createMember(8)]);
    conversations.update.mockResolvedValue({ affected: 1 });
    notifications.save.mockResolvedValue([]);

    const result = await service.send(
      { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
      42,
      { content: 'Xin chào bạn' },
    );

    expect(messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 42,
        senderId: 7,
        content: 'Xin chào bạn',
        type: MessageType.TEXT,
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 8,
        type: NotificationType.MESSAGE,
        linkUrl: '/conversations/42',
      }),
    );
    expect(result.message.sender).not.toHaveProperty('email');
    expect(result.recipientIds).toEqual([8]);
  });

  it('does not let an active member edit another user\'s message', async () => {
    members.findOne.mockResolvedValue(createMember(7));
    messages.findOneBy.mockResolvedValue(createMessage({ senderId: 8 }));

    await expect(
      service.edit(
        { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
        42,
        81,
        { content: 'Nội dung mới' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(messages.update).not.toHaveBeenCalled();
  });

  it('soft-deletes a sender\'s message with an atomic ownership condition', async () => {
    members.findOne.mockResolvedValue(createMember(7));
    messages.findOneBy.mockResolvedValue(createMessage({ senderId: 7 }));
    messages.update.mockResolvedValue({ affected: 1 });

    await expect(
      service.remove(
        { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
        42,
        81,
      ),
    ).resolves.toBeUndefined();

    expect(messages.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 81,
        conversationId: 42,
        senderId: 7,
        isDeleted: false,
      }),
      expect.objectContaining({
        isDeleted: true,
        content: 'Tin nhắn đã được xóa',
        editedAt: expect.any(Date),
      }),
    );
  });

  it('rejects blank message content after trimming', async () => {
    const input = plainToInstance(MessageContentDto, { content: '   ' });

    expect(input.content).toBe('');
    expect(await validate(input)).not.toHaveLength(0);
  });

  it('reports a lost atomic edit as a conflict instead of overwriting a new state', async () => {
    members.findOne.mockResolvedValue(createMember(7));
    messages.findOneBy.mockResolvedValue(createMessage({ senderId: 7 }));
    messages.update.mockResolvedValue({ affected: 0 });

    await expect(
      service.edit(
        { id: 7, fullName: 'Người gửi', role: UserRole.STUDENT },
        42,
        81,
        { content: 'Nội dung mới' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
