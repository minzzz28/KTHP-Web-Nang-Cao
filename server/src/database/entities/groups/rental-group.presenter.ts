import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { GroupMember, RentalGroup } from '../../database/entities';

export function presentGroupMember(member: GroupMember) {
  return {
    id: member.id,
    groupId: member.groupId,
    studentId: member.studentId,
    role: member.role,
    joinedAt: member.joinedAt,
    leftAt: member.leftAt,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    student: member.student ? presentPublicUserSummary(member.student) : null,
  };
}

/**
 * Public-facing group representation.  Relationships are mapped explicitly
 * so group pages never serialize private account fields from `users`.
 */
export function presentRentalGroup(group: RentalGroup) {
  return {
    id: group.id,
    creatorId: group.creatorId,
    roomId: group.roomId,
    name: group.name,
    maxMembers: group.maxMembers,
    budgetPerPerson: group.budgetPerPerson,
    moveInDate: group.moveInDate,
    rules: group.rules,
    zaloGroupUrl: group.zaloGroupUrl,
    telegramGroupUrl: group.telegramGroupUrl,
    status: group.status,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    creator: group.creator ? presentPublicUserSummary(group.creator) : null,
    room: group.room
      ? {
          id: group.room.id,
          name: group.room.name,
          code: group.room.code,
          price: group.room.price,
          status: group.room.status,
          property: group.room.property
            ? {
                name: group.room.property.name,
                address: group.room.property.address,
              }
            : null,
        }
      : null,
    members: (group.members ?? [])
      .filter((member) => member.leftAt === null)
      .map(presentGroupMember),
    conversation: group.conversation ? { id: group.conversation.id } : null,
  };
}
