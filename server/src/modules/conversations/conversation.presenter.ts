import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import {
  Conversation,
  ConversationMember,
  Message,
} from '../../database/entities';

export function presentConversationMember(member: ConversationMember) {
  return {
    id: member.id,
    conversationId: member.conversationId,
    userId: member.userId,
    lastReadAt: member.lastReadAt,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    user: member.user ? presentPublicUserSummary(member.user) : null,
  };
}

/** Messages are text, not HTML; the React client renders this field as text. */
export function presentMessage(message: Message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    type: message.type,
    sentAt: message.sentAt,
    editedAt: message.editedAt,
    isDeleted: message.isDeleted,
    sender: message.sender ? presentPublicUserSummary(message.sender) : null,
  };
}

/**
 * Keeps the legacy response shape while manually presenting every nested user
 * record, so account email/phone/password data cannot leak through relations.
 */
export function presentConversation(
  conversation: Conversation,
  lastMessage: Message | null,
) {
  return {
    id: conversation.id,
    type: conversation.type,
    title: conversation.title,
    directPairKey: conversation.directPairKey,
    rentalGroupId: conversation.rentalGroupId,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    rentalGroup: conversation.rentalGroup
      ? {
          id: conversation.rentalGroup.id,
          name: conversation.rentalGroup.name,
          status: conversation.rentalGroup.status,
        }
      : null,
    members: (conversation.members ?? [])
      .filter((member) => member.leftAt === null)
      .map(presentConversationMember),
    lastMessage: lastMessage ? presentMessage(lastMessage) : null,
  };
}
