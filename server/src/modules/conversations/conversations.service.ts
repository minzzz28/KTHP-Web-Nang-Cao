import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
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
} from '../../database/enums/domain.enums';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { MessageContentDto } from './dto/message-content.dto';
import { presentConversation, presentMessage } from './conversation.presenter';

export type ConversationActor = {
  id: number;
  fullName: string;
  role: UserRole;
};

type DatabaseError = { code?: string; errno?: number };

function directPairKey(firstUserId: number, secondUserId: number): string {
  return [firstUserId, secondUserId]
    .sort((left, right) => left - right)
    .join(':');
}

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as DatabaseError).code === 'ER_DUP_ENTRY' ||
      (error as DatabaseError).errno === 1062)
  );
}

export interface ConversationListResult {
  data: { items: Array<ReturnType<typeof presentConversation>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessageListResult {
  data: { items: Array<ReturnType<typeof presentMessage>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SentMessageResult {
  conversationId: number;
  recipientIds: number[];
  message: ReturnType<typeof presentMessage>;
}

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly members: Repository<ConversationMember>,
    @InjectRepository(Message)
    private readonly messages: Repository<Message>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    userId: number,
    query: ListConversationsQueryDto,
  ): Promise<ConversationListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    // Page the caller's own membership rows.  Selecting conversations through
    // a filtered `members` relation would hydrate only that one member and
    // make direct-chat counterparts disappear from the response.
    const [memberships, total] = await this.members.findAndCount({
      where: { userId, leftAt: IsNull() },
      relations: {
        conversation: { rentalGroup: true, members: { user: true } },
      },
      order: { conversation: { lastMessageAt: 'DESC', createdAt: 'DESC' } },
      skip: (page - 1) * limit,
      take: limit,
    });

    const latestMessages = await this.loadLatestMessages(
      memberships.map((membership) => membership.conversationId),
    );
    const items = memberships.map((membership) =>
      presentConversation(
        membership.conversation,
        latestMessages.get(membership.conversationId) ?? null,
      ),
    );

    return {
      data: { items },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async get(userId: number, conversationId: number) {
    return this.loadConversationForActiveMember(userId, conversationId);
  }

  /** Used by the Socket.IO room-join handler without exposing message data. */
  async isActiveMember(userId: number, conversationId: number): Promise<boolean> {
    return Boolean(
      await this.members.findOneBy({
        conversationId,
        userId,
        leftAt: IsNull(),
      }),
    );
  }

  async createDirect(actor: ConversationActor, participantId: number) {
    if (participantId === actor.id) {
      throw new UnprocessableEntityException(
        'Không thể tạo cuộc trò chuyện với chính bạn',
      );
    }
    if (actor.role === UserRole.ADMIN) {
      throw new UnprocessableEntityException('Người nhận không thể trò chuyện');
    }

    const participant = await this.users.findOneBy({ id: participantId });
    if (
      !participant ||
      participant.status !== UserStatus.ACTIVE ||
      participant.role === UserRole.ADMIN
    ) {
      throw new UnprocessableEntityException('Người nhận không thể trò chuyện');
    }

    const pairKey = directPairKey(actor.id, participant.id);
    const existing = await this.conversations.findOneBy({
      directPairKey: pairKey,
    });
    if (existing) {
      return this.loadDirectConversationForMember(actor.id, existing.id);
    }

    try {
      const conversationId = await this.dataSource.transaction(async (manager) => {
        const conversations = manager.getRepository(Conversation);
        const members = manager.getRepository(ConversationMember);
        const concurrentConversation = await conversations.findOneBy({
          directPairKey: pairKey,
        });
        if (concurrentConversation) return concurrentConversation.id;

        const conversation = await conversations.save(
          conversations.create({
            type: ConversationType.DIRECT,
            title: null,
            directPairKey: pairKey,
            rentalGroupId: null,
            lastMessageAt: null,
          }),
        );
        await members.save(
          members.create([
            {
              conversationId: conversation.id,
              userId: actor.id,
              lastReadAt: null,
              leftAt: null,
            },
            {
              conversationId: conversation.id,
              userId: participant.id,
              lastReadAt: null,
              leftAt: null,
            },
          ]),
        );

        return conversation.id;
      });

      return this.loadDirectConversationForMember(actor.id, conversationId);
    } catch (error) {
      // The unique pair key is the final authority when two browser tabs open
      // the same direct conversation at the same time.
      if (isUniqueConstraintError(error)) {
        const concurrentConversation = await this.conversations.findOneBy({
          directPairKey: pairKey,
        });
        if (concurrentConversation) {
          return this.loadDirectConversationForMember(
            actor.id,
            concurrentConversation.id,
          );
        }
      }
      throw error;
    }
  }

  async listMessages(
    userId: number,
    conversationId: number,
    query: ListConversationsQueryDto,
  ): Promise<MessageListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    return this.dataSource.transaction(async (manager) => {
      const members = manager.getRepository(ConversationMember);
      const messages = manager.getRepository(Message);
      const membership = await this.requireActiveMembership(
        members,
        userId,
        conversationId,
        true,
      );
      const [items, total] = await messages.findAndCount({
        where: { conversationId, isDeleted: false },
        relations: { sender: true },
        order: { sentAt: 'DESC', id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // Advance the receipt only through the newest message that this page
      // actually delivered.  A message inserted between the query and update
      // must remain unread, and loading an older page must not mark newer
      // messages as read.
      const newestDeliveredAt = items[0]?.sentAt;
      if (newestDeliveredAt) {
        const readResult = await members.update(
          { id: membership.id, userId, conversationId, leftAt: IsNull() },
          { lastReadAt: newestDeliveredAt },
        );
        if (!readResult.affected) {
          throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
        }
      }

      // The oldest item in the selected (newest-first) page must appear first
      // so the existing chat screen reads naturally from top to bottom.
      return {
        data: { items: items.reverse().map(presentMessage) },
        meta: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    });
  }

  async send(
    actor: ConversationActor,
    conversationId: number,
    input: MessageContentDto,
  ): Promise<SentMessageResult> {
    return this.dataSource.transaction(async (manager) => {
      const conversations = manager.getRepository(Conversation);
      const members = manager.getRepository(ConversationMember);
      const messages = manager.getRepository(Message);
      const notifications = manager.getRepository(Notification);
      await this.requireActiveMembership(members, actor.id, conversationId, true);

      // Serializing sends per conversation avoids a later transaction writing
      // an older timestamp back into lastMessageAt.
      const conversation = await conversations.findOne({
        where: { id: conversationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!conversation) {
        throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
      }

      const sentAt = new Date();
      const saved = await messages.save(
        messages.create({
          conversationId,
          senderId: actor.id,
          content: input.content,
          type: MessageType.TEXT,
          sentAt,
          editedAt: null,
          isDeleted: false,
        }),
      );
      await conversations.update({ id: conversation.id }, { lastMessageAt: sentAt });

      const recipients = await members.find({
        where: {
          conversationId,
          userId: Not(actor.id),
          leftAt: IsNull(),
        },
      });
      if (recipients.length > 0) {
        await notifications.save(
          recipients.map((recipient) =>
            notifications.create({
              userId: recipient.userId,
              type: NotificationType.MESSAGE,
              title: 'Bạn có tin nhắn mới',
              content: `${actor.fullName} đã gửi cho bạn một tin nhắn.`,
              linkUrl: `/conversations/${conversationId}`,
              isRead: false,
              readAt: null,
            }),
          ),
        );
      }

      const message = await messages.findOne({
        where: { id: saved.id },
        relations: { sender: true },
      });
      if (!message) {
        throw new NotFoundException('Không tìm thấy tin nhắn vừa gửi');
      }

      return {
        conversationId,
        recipientIds: recipients.map((recipient) => recipient.userId),
        message: presentMessage(message),
      };
    });
  }

  async edit(
    actor: ConversationActor,
    conversationId: number,
    messageId: number,
    input: MessageContentDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const members = manager.getRepository(ConversationMember);
      const messages = manager.getRepository(Message);
      await this.requireActiveMembership(members, actor.id, conversationId, true);

      const message = await messages.findOneBy({
        id: messageId,
        conversationId,
        isDeleted: false,
      });
      if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');
      if (message.senderId !== actor.id) {
        throw new ForbiddenException('Chỉ người gửi có thể sửa tin nhắn');
      }

      const result = await messages.update(
        {
          id: messageId,
          conversationId,
          senderId: actor.id,
          isDeleted: false,
        },
        { content: input.content, editedAt: new Date() },
      );
      if (!result.affected) {
        throw new ConflictException('Tin nhắn đã thay đổi, vui lòng tải lại');
      }

      const updated = await messages.findOne({
        where: { id: messageId },
        relations: { sender: true },
      });
      if (!updated) {
        throw new ConflictException('Tin nhắn đã thay đổi, vui lòng tải lại');
      }
      return presentMessage(updated);
    });
  }

  async remove(
    actor: ConversationActor,
    conversationId: number,
    messageId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const members = manager.getRepository(ConversationMember);
      const messages = manager.getRepository(Message);
      await this.requireActiveMembership(members, actor.id, conversationId, true);

      const message = await messages.findOneBy({
        id: messageId,
        conversationId,
        isDeleted: false,
      });
      if (!message) throw new NotFoundException('Không tìm thấy tin nhắn');
      if (message.senderId !== actor.id) {
        throw new ForbiddenException('Chỉ người gửi có thể xóa tin nhắn');
      }

      const result = await messages.update(
        {
          id: messageId,
          conversationId,
          senderId: actor.id,
          isDeleted: false,
        },
        {
          isDeleted: true,
          content: 'Tin nhắn đã được xóa',
          editedAt: new Date(),
        },
      );
      if (!result.affected) {
        throw new ConflictException('Tin nhắn đã thay đổi, vui lòng tải lại');
      }
    });
  }

  private async requireActiveMembership(
    members: Repository<ConversationMember>,
    userId: number,
    conversationId: number,
    lock = false,
  ): Promise<ConversationMember> {
    const membership = await members.findOne({
      where: { conversationId, userId, leftAt: IsNull() },
      ...(lock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    // A non-member sees the same result as a nonexistent conversation. This
    // prevents conversation IDs from becoming an enumeration oracle.
    if (!membership) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }
    return membership;
  }

  private async loadDirectConversationForMember(
    userId: number,
    conversationId: number,
  ) {
    return this.loadConversationForActiveMember(userId, conversationId);
  }

  private async loadLatestMessages(
    conversationIds: number[],
  ): Promise<Map<number, Message>> {
    if (conversationIds.length === 0) return new Map();

    // The values are still passed as TypeORM parameters.  The correlated
    // subquery is static SQL only and prevents a page of 50 conversations
    // from issuing 50 separate latest-message queries.
    const messages = await this.messages
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.conversation_id IN (:...conversationIds)', {
        conversationIds,
      })
      .andWhere('message.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere(
        `message.id = (
          SELECT latest.id
          FROM messages latest
          WHERE latest.conversation_id = message.conversation_id
            AND latest.is_deleted = :isDeleted
          ORDER BY latest.sent_at DESC, latest.id DESC
          LIMIT 1
        )`,
      )
      .getMany();

    return new Map(messages.map((message) => [message.conversationId, message]));
  }

  private async loadConversationForActiveMember(
    userId: number,
    conversationId: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const members = manager.getRepository(ConversationMember);
      await this.requireActiveMembership(members, userId, conversationId, true);

      const conversations = manager.getRepository(Conversation);
      const messages = manager.getRepository(Message);
      const conversation = await conversations.findOne({
        where: { id: conversationId },
        relations: { rentalGroup: true, members: { user: true } },
      });
      if (!conversation) {
        throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
      }

      const lastMessage = await messages.findOne({
        where: { conversationId, isDeleted: false },
        relations: { sender: true },
        order: { sentAt: 'DESC', id: 'DESC' },
      });
      return presentConversation(conversation, lastMessage);
    });
  }
}
