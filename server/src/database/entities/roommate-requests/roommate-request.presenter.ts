import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { RoommateRequest } from '../../database/entities';

function presentParticipant(requestParticipant: RoommateRequest['sender']) {
  if (!requestParticipant) return null;

  const user = presentPublicUserSummary(requestParticipant);
  return { ...user, user: { ...user } };
}

/**
 * The request model joins two account records.  Always map it manually so a
 * relation can never expose passwords, email addresses, or phone numbers.
 */
export function presentRoommateRequest(request: RoommateRequest) {
  const sender = presentParticipant(request.sender);
  const recipient = presentParticipant(request.recipient);

  return {
    id: request.id,
    senderId: request.senderId,
    recipientId: request.recipientId,
    postId: request.postId,
    roomId: request.roomId,
    message: request.message,
    status: request.status,
    respondedAt: request.respondedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    sender,
    recipient,
    // Legacy client alias retained during the gradual NestJS migration.
    receiver: recipient,
    post: request.post
      ? {
          id: request.post.id,
          title: request.post.title,
          status: request.post.status,
        }
      : null,
    room: request.room
      ? {
          id: request.room.id,
          name: request.room.name,
          status: request.room.status,
        }
      : null,
  };
}
