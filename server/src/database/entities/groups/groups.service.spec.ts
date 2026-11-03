import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Conversation,
  ConversationMember,
  GroupMember,
  Notification,
  RentalGroup,
  Room,
  User,
} from '../../database/entities';
import {
  ConversationType,
  GroupMemberRole,
  RentalGroupStatus,
  RoomStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { GroupsService } from './groups.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

function createUser(id: number, fullName = `Sinh viên ${id}`): User {
  return {
    id,
    username: `student-${id}`,
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
  studentId: number,
  overrides: Partial<GroupMember> = {},
): GroupMember {
  return {
    id: studentId + 100,
    groupId: 42,
    studentId,
    role: studentId === 7 ? GroupMemberRole.LEADER : GroupMemberRole.MEMBER,
    joinedAt: createdAt,
    leftAt: null,
    createdAt,
    updatedAt,
    student: createUser(studentId),
    ...overrides,
  } as GroupMember;
}

function createGroup(
  overrides: Partial<RentalGroup> = {},
): RentalGroup {
  return {
    id: 42,
    creatorId: 7,
    roomId: null,
    name: 'Nhóm Mẫu',
    maxMembers: 3,
    budgetPerPerson: '2500000',
    moveInDate: null,
    rules: null,
    zaloGroupUrl: null,
    telegramGroupUrl: null,
    status: RentalGroupStatus.OPEN,
    createdAt,
    updatedAt,
    creator: createUser(7),
    room: null,
    members: [createMember(7)],
    conversation: {
      id: 91,
      type: ConversationType.GROUP,
      title: 'Nhóm Mẫu',
      directPairKey: null,
      rentalGroupId: 42,
      lastMessageAt: null,
      createdAt,
      updatedAt,
      rentalGroup: null,
      members: [],
      messages: [],
    } as Conversation,
    ...overrides,
  } as RentalGroup;
}

function createConversationMember(
  userId: number,
  overrides: Partial<ConversationMember> = {},
): ConversationMember {
  return {
    id: userId + 200,
    conversationId: 91,
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

function publicGroupBuilder(group: RentalGroup | null) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(group),
    getMany: jest.fn().mockResolvedValue(group ? [group] : []),
    getManyAndCount: jest.fn().mockResolvedValue(group ? [[group], 1] : [[], 0]),
  };
}

function groupIdPageBuilder(
  ids: number[],
  total = ids.length,
) {
  const countBuilder = { getCount: jest.fn().mockResolvedValue(total) };
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnValue(countBuilder),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest
      .fn()
      .mockResolvedValue(ids.map((id) => ({ id: String(id) }))),
  };
}

describe('GroupsService', () => {
  const groups = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const members = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const conversations = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const conversationMembers = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const notifications = { create: jest.fn(), save: jest.fn() };
  const rooms = { findOneBy: jest.fn() };
  const users = { findOneBy: jest.fn() };
  const conversationsRealtime = { revokeConversationMembership: jest.fn() };
  let transaction: jest.Mock;
  let service: GroupsService;

  beforeEach(() => {
    jest.resetAllMocks();
    groups.create.mockImplementation((input: unknown) => input);
    members.create.mockImplementation((input: unknown) => input);
    conversations.create.mockImplementation((input: unknown) => input);
    conversationMembers.create.mockImplementation((input: unknown) => input);
    notifications.create.mockImplementation((input: unknown) => input);
    groups.createQueryBuilder.mockReturnValue(publicGroupBuilder(createGroup()));

    const repositories = new Map<unknown, unknown>([
      [RentalGroup, groups],
      [GroupMember, members],
      [Conversation, conversations],
      [ConversationMember, conversationMembers],
      [Notification, notifications],
      [Room, rooms],
      [User, users],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new GroupsService(
      groups as unknown as Repository<RentalGroup>,
      { transaction } as unknown as DataSource,
      conversationsRealtime as never,
    );
  });

  it('lists only public group data and excludes departed members', async () => {
    const group = createGroup({
      members: [
        createMember(7),
        createMember(8, { leftAt: updatedAt }),
      ],
    });
    const builder = groupIdPageBuilder([42]);
    const hydrationBuilder = publicGroupBuilder(group);
    groups.createQueryBuilder
      .mockReturnValueOnce(builder)
      .mockReturnValueOnce(hydrationBuilder);

    const result = await service.list({ page: 1, limit: 50 });

    expect(builder.where).toHaveBeenCalledWith(
      'rentalGroup.status IN (:...statuses)',
      { statuses: [RentalGroupStatus.OPEN, RentalGroupStatus.FULL] },
    );
    expect(result.data.items[0].members).toHaveLength(1);
    expect(result.data.items[0].creator).not.toHaveProperty('email');
    expect(result.data.items[0].members[0].student).not.toHaveProperty(
      'passwordHash',
    );
  });

  it('creates the group, leader, and group chat in one transaction', async () => {
    const group = createGroup();
    groups.save.mockResolvedValue(group);
    conversations.save.mockResolvedValue(group.conversation);
    members.save.mockResolvedValue(createMember(7));
    conversationMembers.save.mockResolvedValue(createConversationMember(7));
    groups.createQueryBuilder.mockReturnValue(publicGroupBuilder(group));

    const result = await service.create(
      { id: 7, fullName: 'Trưởng nhóm' },
      {
        name: 'Nhóm Mẫu',
        maxMembers: 3,
        budgetPerPerson: 2_500_000,
      },
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(groups.create).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 7,
        status: RentalGroupStatus.OPEN,
        budgetPerPerson: '2500000',
      }),
    );
    expect(members.create).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 42,
        studentId: 7,
        role: GroupMemberRole.LEADER,
      }),
    );
    expect(conversations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ConversationType.GROUP,
        rentalGroupId: 42,
        title: 'Nhóm Mẫu',
      }),
    );
    expect(conversationMembers.create).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 91, userId: 7 }),
    );
    expect(result.creator).not.toHaveProperty('email');
  });

  it('adds a student and their chat membership atomically, then fills the group', async () => {
    const group = createGroup({ maxMembers: 2 });
    groups.findOne.mockResolvedValue(group);
    members.find.mockResolvedValue([createMember(7)]);
    users.findOneBy.mockResolvedValue(createUser(8));
    members.findOne.mockResolvedValue(null);
    conversations.findOneBy.mockResolvedValue(group.conversation);
    conversationMembers.findOne.mockResolvedValue(null);
    members.save.mockResolvedValue(createMember(8));
    conversationMembers.save.mockResolvedValue(createConversationMember(8));
    groups.update.mockResolvedValue({ affected: 1 });
    notifications.save.mockResolvedValue({});

    const result = await service.addMember(
      { id: 7, fullName: 'Trưởng nhóm' },
      42,
      8,
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(members.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ groupId: 42 }),
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(members.create).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 42, studentId: 8 }),
    );
    expect(conversationMembers.create).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: 91, userId: 8 }),
    );
    expect(groups.update).toHaveBeenCalledWith(
      { id: 42 },
      { status: RentalGroupStatus.FULL },
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 8, linkUrl: '/groups/42' }),
    );
    expect(result.student).not.toHaveProperty('email');
  });

  it('rejects the last available seat before changing group or chat data', async () => {
    const group = createGroup({ maxMembers: 2 });
    groups.findOne.mockResolvedValue(group);
    members.find.mockResolvedValue([createMember(7), createMember(8)]);

    await expect(
      service.addMember({ id: 7, fullName: 'Trưởng nhóm' }, 42, 9),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(users.findOneBy).not.toHaveBeenCalled();
    expect(members.save).not.toHaveBeenCalled();
    expect(conversationMembers.save).not.toHaveBeenCalled();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('does not let a leader shrink capacity below the active member count', async () => {
    const group = createGroup({ maxMembers: 3 });
    groups.findOne.mockResolvedValue(group);
    members.find.mockResolvedValue([createMember(7), createMember(8)]);

    await expect(
      service.update(7, 42, { maxMembers: 1 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(groups.update).not.toHaveBeenCalled();
  });

  it('removes a member from group chat in the same transaction and reopens FULL', async () => {
    const group = createGroup({
      maxMembers: 2,
      status: RentalGroupStatus.FULL,
    });
    groups.findOne.mockResolvedValue(group);
    members.find.mockResolvedValue([createMember(7), createMember(8)]);
    conversations.findOneBy.mockResolvedValue(group.conversation);
    conversationMembers.findOne.mockResolvedValue(createConversationMember(8));
    members.update.mockResolvedValue({ affected: 1 });
    conversationMembers.update.mockResolvedValue({ affected: 1 });
    groups.update.mockResolvedValue({ affected: 1 });

    await expect(service.removeMember(7, 42, 8)).resolves.toBeUndefined();

    expect(members.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 108, leftAt: expect.anything() }),
      expect.objectContaining({ leftAt: expect.any(Date) }),
    );
    expect(conversationMembers.update).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 8, leftAt: expect.anything() }),
      expect.objectContaining({ leftAt: expect.any(Date) }),
    );
    expect(groups.update).toHaveBeenCalledWith(
      { id: 42 },
      { status: RentalGroupStatus.OPEN },
    );
    expect(conversationsRealtime.revokeConversationMembership).toHaveBeenCalledWith(
      8,
      91,
    );
  });

  it('changes leader and creator together under the active-membership condition', async () => {
    const group = createGroup();
    groups.findOne.mockResolvedValue(group);
    members.find.mockResolvedValue([createMember(7), createMember(8)]);
    members.update.mockResolvedValue({ affected: 1 });
    groups.update.mockResolvedValue({ affected: 1 });
    groups.createQueryBuilder.mockReturnValue(publicGroupBuilder(group));

    await expect(service.transferLeadership(7, 42, 8)).resolves.toMatchObject({
      id: 42,
    });

    expect(members.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        groupId: 42,
        role: GroupMemberRole.LEADER,
        leftAt: expect.anything(),
      }),
      { role: GroupMemberRole.MEMBER },
    );
    expect(members.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 108, groupId: 42 }),
      { role: GroupMemberRole.LEADER },
    );
    expect(groups.update).toHaveBeenCalledWith(
      { id: 42 },
      { creatorId: 8 },
    );
  });

  it('does not deactivate a group member if their active chat membership is missing', async () => {
    const group = createGroup();
    groups.findOne.mockResolvedValue(group);
    members.find.mockResolvedValue([createMember(7), createMember(8)]);
    conversations.findOneBy.mockResolvedValue(group.conversation);
    conversationMembers.findOne.mockResolvedValue(null);

    await expect(service.removeMember(7, 42, 8)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(members.update).not.toHaveBeenCalled();
  });

  it('rejects a hidden room before writing a new group', async () => {
    rooms.findOneBy.mockResolvedValue({ id: 5, status: RoomStatus.HIDDEN });

    await expect(
      service.create(
        { id: 7, fullName: 'Trưởng nhóm' },
        {
          roomId: 5,
          name: 'Nhóm Mẫu',
          maxMembers: 3,
          budgetPerPerson: 2_500_000,
        },
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(groups.save).not.toHaveBeenCalled();
  });
});
