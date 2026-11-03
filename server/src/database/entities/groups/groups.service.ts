import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  IsNull,
  Not,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
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
  NotificationType,
  RentalGroupStatus,
  RoomStatus,
  UserRole,
  UserStatus,
} from '../../database/enums/domain.enums';
import { CreateRentalGroupDto } from './dto/create-rental-group.dto';
import { ListRentalGroupsQueryDto } from './dto/list-rental-groups-query.dto';
import { UpdateRentalGroupDto } from './dto/update-rental-group.dto';
import {
  presentGroupMember,
  presentRentalGroup,
} from './rental-group.presenter';
import { ConversationsRealtimeGateway } from '../conversations/conversations.realtime-gateway';

export type GroupActor = {
  id: number;
  fullName: string;
};

export interface RentalGroupListResult {
  data: { items: Array<ReturnType<typeof presentRentalGroup>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type GroupRepositories = {
  groups: Repository<RentalGroup>;
  members: Repository<GroupMember>;
  conversations: Repository<Conversation>;
  conversationMembers: Repository<ConversationMember>;
  notifications: Repository<Notification>;
  rooms: Repository<Room>;
  users: Repository<User>;
};

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(RentalGroup)
    private readonly groups: Repository<RentalGroup>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly conversationsRealtime?: ConversationsRealtimeGateway,
  ) {}

  async list(
    query: ListRentalGroupsQueryDto,
  ): Promise<RentalGroupListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.groups.createQueryBuilder('rentalGroup');

    if (query.status) {
      builder.where('rentalGroup.status = :status', { status: query.status });
    } else {
      builder.where('rentalGroup.status IN (:...statuses)', {
        statuses: [RentalGroupStatus.OPEN, RentalGroupStatus.FULL],
      });
    }
    if (query.roomId !== undefined) {
      builder.andWhere('rentalGroup.room_id = :roomId', {
        roomId: query.roomId,
      });
    }

    return this.paginateGroupIds(builder, page, limit, 'rentalGroup.createdAt');
  }

  async mine(
    studentId: number,
    query: ListRentalGroupsQueryDto,
  ): Promise<RentalGroupListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.groups
      .createQueryBuilder('rentalGroup')
      .innerJoin(
        'rentalGroup.members',
        'activeMembership',
        'activeMembership.student_id = :studentId AND activeMembership.left_at IS NULL',
        { studentId },
      );

    return this.paginateGroupIds(builder, page, limit, 'rentalGroup.updatedAt');
  }

  async get(groupId: number) {
    return this.loadPublicGroup(this.groups, groupId);
  }

  async create(actor: GroupActor, input: CreateRentalGroupDto) {
    const groupId = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);

      if (input.roomId !== undefined && input.roomId !== null) {
        const room = await repositories.rooms.findOneBy({ id: input.roomId });
        if (!room || room.status === RoomStatus.HIDDEN) {
          throw new NotFoundException('Không tìm thấy phòng được chọn');
        }
      }

      const group = await repositories.groups.save(
        repositories.groups.create({
          creatorId: actor.id,
          roomId: input.roomId ?? null,
          name: input.name,
          maxMembers: input.maxMembers,
          // MySQL DECIMAL is represented as a string by the existing entity.
          budgetPerPerson: String(input.budgetPerPerson),
          moveInDate: input.moveInDate ?? null,
          rules: input.rules ?? null,
          zaloGroupUrl: input.zaloGroupUrl ?? null,
          telegramGroupUrl: input.telegramGroupUrl ?? null,
          status: RentalGroupStatus.OPEN,
        }),
      );

      await repositories.members.save(
        repositories.members.create({
          groupId: group.id,
          studentId: actor.id,
          role: GroupMemberRole.LEADER,
          leftAt: null,
        }),
      );

      const conversation = await repositories.conversations.save(
        repositories.conversations.create({
          type: ConversationType.GROUP,
          title: group.name,
          directPairKey: null,
          rentalGroupId: group.id,
          lastMessageAt: null,
        }),
      );
      await repositories.conversationMembers.save(
        repositories.conversationMembers.create({
          conversationId: conversation.id,
          userId: actor.id,
          lastReadAt: null,
          leftAt: null,
        }),
      );

      return group.id;
    });

    return this.loadPublicGroup(this.groups, groupId);
  }

  async update(
    actorId: number,
    groupId: number,
    input: UpdateRentalGroupDto,
  ) {
    const updatedGroupId = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const group = await this.requireLockedGroup(repositories.groups, groupId);
      const activeMembers = await this.lockActiveMembers(
        repositories.members,
        group.id,
      );
      this.requireLeader(activeMembers, actorId, group.id);

      const values = this.toUpdateValues(input);
      if (Object.keys(values).length === 0) {
        throw new UnprocessableEntityException('Cần có dữ liệu cập nhật');
      }

      const nextMaxMembers = values.maxMembers ?? group.maxMembers;
      if (nextMaxMembers < activeMembers.length) {
        throw new UnprocessableEntityException(
          'Số thành viên tối đa không thể nhỏ hơn số thành viên hiện tại',
        );
      }

      // OPEN/FULL is derived from active seats whenever this group is edited.
      // CLOSED and CANCELLED remain explicit administrative/lifecycle states.
      if (
        group.status === RentalGroupStatus.OPEN ||
        group.status === RentalGroupStatus.FULL
      ) {
        values.status = this.capacityStatus(activeMembers.length, nextMaxMembers);
      }

      const result = await repositories.groups.update({ id: group.id }, values);
      if (!result.affected) {
        throw new ConflictException('Nhóm thuê đã thay đổi, vui lòng tải lại');
      }

      if (values.name !== undefined) {
        const conversation = await repositories.conversations.findOneBy({
          rentalGroupId: group.id,
        });
        if (conversation) {
          if (conversation.type !== ConversationType.GROUP) {
            throw new ConflictException('Cuộc trò chuyện nhóm không hợp lệ');
          }
          await repositories.conversations.update(
            { id: conversation.id, rentalGroupId: group.id },
            { title: values.name },
          );
        }
      }

      return group.id;
    });

    return this.loadPublicGroup(this.groups, updatedGroupId);
  }

  async addMember(actor: GroupActor, groupId: number, studentId: number) {
    return this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const group = await this.requireLockedGroup(repositories.groups, groupId);
      const activeMembers = await this.lockActiveMembers(
        repositories.members,
        group.id,
      );
      this.requireLeader(activeMembers, actor.id, group.id);

      // Keep the legacy/UI contract: a group must explicitly be OPEN before
      // it can receive another member.  The active-count check below remains
      // the final authority for stale data such as an OPEN group already at
      // capacity.
      if (group.status !== RentalGroupStatus.OPEN) {
        throw new ConflictException('Nhóm hiện không nhận thành viên mới');
      }
      if (activeMembers.length >= group.maxMembers) {
        throw new ConflictException('Nhóm đã đủ thành viên');
      }

      const candidate = await repositories.users.findOneBy({ id: studentId });
      if (
        !candidate ||
        candidate.role !== UserRole.STUDENT ||
        candidate.status !== UserStatus.ACTIVE
      ) {
        throw new UnprocessableEntityException('Sinh viên không hợp lệ');
      }

      const existingMembership = await repositories.members.findOne({
        where: { groupId: group.id, studentId: candidate.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (existingMembership?.leftAt === null) {
        throw new ConflictException('Sinh viên này đã là thành viên nhóm');
      }

      const conversation = await this.requireGroupConversation(
        repositories.conversations,
        group.id,
      );
      const existingConversationMembership =
        await repositories.conversationMembers.findOne({
          where: { conversationId: conversation.id, userId: candidate.id },
          lock: { mode: 'pessimistic_write' },
        });
      if (existingConversationMembership?.leftAt === null) {
        throw new ConflictException('Dữ liệu thành viên chat chưa đồng bộ');
      }

      const now = new Date();
      let membership: GroupMember;
      if (existingMembership) {
        const result = await repositories.members.update(
          {
            id: existingMembership.id,
            groupId: group.id,
            studentId: candidate.id,
            leftAt: Not(IsNull()),
          },
          {
            leftAt: null,
            joinedAt: now,
            role: GroupMemberRole.MEMBER,
          },
        );
        if (!result.affected) {
          throw new ConflictException('Thành viên nhóm đã thay đổi, vui lòng tải lại');
        }
        membership = Object.assign(existingMembership, {
          leftAt: null,
          joinedAt: now,
          role: GroupMemberRole.MEMBER,
        });
      } else {
        membership = await repositories.members.save(
          repositories.members.create({
            groupId: group.id,
            studentId: candidate.id,
            role: GroupMemberRole.MEMBER,
            joinedAt: now,
            leftAt: null,
          }),
        );
      }

      if (existingConversationMembership) {
        const result = await repositories.conversationMembers.update(
          {
            id: existingConversationMembership.id,
            conversationId: conversation.id,
            userId: candidate.id,
            leftAt: Not(IsNull()),
          },
          { leftAt: null, joinedAt: now },
        );
        if (!result.affected) {
          throw new ConflictException('Thành viên chat đã thay đổi, vui lòng tải lại');
        }
      } else {
        await repositories.conversationMembers.save(
          repositories.conversationMembers.create({
            conversationId: conversation.id,
            userId: candidate.id,
            lastReadAt: null,
            joinedAt: now,
            leftAt: null,
          }),
        );
      }

      const status = this.capacityStatus(
        activeMembers.length + 1,
        group.maxMembers,
      );
      if (status !== group.status) {
        await repositories.groups.update({ id: group.id }, { status });
      }

      await repositories.notifications.save(
        repositories.notifications.create({
          userId: candidate.id,
          type: NotificationType.ROOMMATE_REQUEST_RESPONSE,
          title: 'Bạn đã được thêm vào nhóm thuê trọ',
          content: `Bạn đã được thêm vào nhóm ${group.name}.`,
          linkUrl: `/groups/${group.id}`,
          isRead: false,
          readAt: null,
        }),
      );

      membership.student = candidate;
      return presentGroupMember(membership);
    });
  }

  async leave(actorId: number, groupId: number): Promise<void> {
    const conversationId = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const group = await this.requireLockedGroup(repositories.groups, groupId);
      const activeMembers = await this.lockActiveMembers(
        repositories.members,
        group.id,
      );
      const membership = activeMembers.find(
        (member) => member.studentId === actorId,
      );
      if (!membership) {
        throw new ForbiddenException('Bạn không thuộc nhóm này');
      }
      if (membership.role === GroupMemberRole.LEADER) {
        throw new UnprocessableEntityException(
          'Trưởng nhóm cần chuyển quyền trước khi rời nhóm',
        );
      }

      return this.deactivateMember(
        repositories,
        group,
        membership,
        activeMembers.length,
      );
    });
    this.conversationsRealtime?.revokeConversationMembership(
      actorId,
      conversationId,
    );
  }

  async removeMember(
    actorId: number,
    groupId: number,
    studentId: number,
  ): Promise<void> {
    const conversationId = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const group = await this.requireLockedGroup(repositories.groups, groupId);
      const activeMembers = await this.lockActiveMembers(
        repositories.members,
        group.id,
      );
      this.requireLeader(activeMembers, actorId, group.id);

      if (studentId === actorId) {
        throw new UnprocessableEntityException(
          'Trưởng nhóm không thể tự xóa mình',
        );
      }
      const target = activeMembers.find(
        (member) => member.studentId === studentId,
      );
      if (!target) {
        throw new NotFoundException('Sinh viên không thuộc nhóm');
      }

      return this.deactivateMember(
        repositories,
        group,
        target,
        activeMembers.length,
      );
    });
    this.conversationsRealtime?.revokeConversationMembership(
      studentId,
      conversationId,
    );
  }

  async transferLeadership(
    actorId: number,
    groupId: number,
    studentId: number,
  ) {
    const updatedGroupId = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const group = await this.requireLockedGroup(repositories.groups, groupId);
      const activeMembers = await this.lockActiveMembers(
        repositories.members,
        group.id,
      );
      const actorMembership = this.requireLeader(
        activeMembers,
        actorId,
        group.id,
      );
      const target = activeMembers.find(
        (member) => member.studentId === studentId,
      );
      if (!target) {
        throw new UnprocessableEntityException(
          'Người được chọn không thuộc nhóm',
        );
      }
      if (target.id === actorMembership.id) {
        throw new UnprocessableEntityException('Người này đã là trưởng nhóm');
      }

      const demoted = await repositories.members.update(
        {
          groupId: group.id,
          role: GroupMemberRole.LEADER,
          leftAt: IsNull(),
        },
        { role: GroupMemberRole.MEMBER },
      );
      if (!demoted.affected) {
        throw new ConflictException('Trưởng nhóm đã thay đổi, vui lòng tải lại');
      }

      const promoted = await repositories.members.update(
        {
          id: target.id,
          groupId: group.id,
          role: GroupMemberRole.MEMBER,
          leftAt: IsNull(),
        },
        { role: GroupMemberRole.LEADER },
      );
      if (!promoted.affected) {
        throw new ConflictException('Thành viên nhóm đã thay đổi, vui lòng tải lại');
      }

      const updated = await repositories.groups.update(
        { id: group.id },
        { creatorId: target.studentId },
      );
      if (!updated.affected) {
        throw new ConflictException('Nhóm thuê đã thay đổi, vui lòng tải lại');
      }

      return group.id;
    });

    return this.loadPublicGroup(this.groups, updatedGroupId);
  }

  private publicGroupQuery(
    repository: Repository<RentalGroup>,
  ): SelectQueryBuilder<RentalGroup> {
    return repository
      .createQueryBuilder('rentalGroup')
      .leftJoinAndSelect('rentalGroup.creator', 'creator')
      .leftJoinAndSelect('rentalGroup.room', 'room')
      .leftJoinAndSelect('room.property', 'property')
      .leftJoinAndSelect(
        'rentalGroup.members',
        'member',
        'member.left_at IS NULL',
      )
      .leftJoinAndSelect('member.student', 'student')
      .leftJoinAndSelect('rentalGroup.conversation', 'conversation');
  }

  private toListResult(
    groups: RentalGroup[],
    page: number,
    limit: number,
    total: number,
  ): RentalGroupListResult {
    return {
      data: { items: groups.map(presentRentalGroup) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  /**
   * Page the group IDs before joining `members`.  Paginating a joined
   * collection directly can duplicate group rows (and omit other groups) on
   * MySQL when a group has more than one active member.
   */
  private async paginateGroupIds(
    builder: SelectQueryBuilder<RentalGroup>,
    page: number,
    limit: number,
    orderColumn: 'rentalGroup.createdAt' | 'rentalGroup.updatedAt',
  ): Promise<RentalGroupListResult> {
    const total = await builder.clone().getCount();
    const idRows = await builder
      .select('rentalGroup.id', 'id')
      .orderBy(orderColumn, 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<{ id: number | string }>();
    const ids = idRows
      .map((row) => Number(row.id))
      .filter((id) => Number.isSafeInteger(id) && id > 0);
    const groups = await this.loadPublicGroups(this.groups, ids);

    return this.toListResult(groups, page, limit, total);
  }

  private async loadPublicGroups(
    repository: Repository<RentalGroup>,
    groupIds: number[],
  ): Promise<RentalGroup[]> {
    if (groupIds.length === 0) return [];

    const hydrated = await this.publicGroupQuery(repository)
      .where('rentalGroup.id IN (:...groupIds)', { groupIds })
      .orderBy('member.joinedAt', 'ASC')
      .getMany();
    const groupsById = new Map(hydrated.map((group) => [group.id, group]));
    return groupIds.flatMap((groupId) => {
      const group = groupsById.get(groupId);
      return group ? [group] : [];
    });
  }

  private async loadPublicGroup(
    repository: Repository<RentalGroup>,
    groupId: number,
  ) {
    const group = await this.publicGroupQuery(repository)
      .where('rentalGroup.id = :groupId', { groupId })
      .orderBy('member.joinedAt', 'ASC')
      .getOne();
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm thuê trọ');
    }
    return presentRentalGroup(group);
  }

  private getRepositories(manager: EntityManager): GroupRepositories {
    return {
      groups: manager.getRepository(RentalGroup),
      members: manager.getRepository(GroupMember),
      conversations: manager.getRepository(Conversation),
      conversationMembers: manager.getRepository(ConversationMember),
      notifications: manager.getRepository(Notification),
      rooms: manager.getRepository(Room),
      users: manager.getRepository(User),
    };
  }

  private async requireLockedGroup(
    repository: Repository<RentalGroup>,
    groupId: number,
  ): Promise<RentalGroup> {
    const group = await repository.findOne({
      where: { id: groupId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm thuê trọ');
    }
    return group;
  }

  private lockActiveMembers(
    repository: Repository<GroupMember>,
    groupId: number,
  ): Promise<GroupMember[]> {
    return repository.find({
      where: { groupId, leftAt: IsNull() },
      lock: { mode: 'pessimistic_write' },
      order: { joinedAt: 'ASC' },
    });
  }

  private requireLeader(
    activeMembers: GroupMember[],
    actorId: number,
    groupId: number,
  ): GroupMember {
    const member = activeMembers.find((item) => item.studentId === actorId);
    if (!member) {
      throw new ForbiddenException('Bạn không thuộc nhóm này');
    }
    if (member.role !== GroupMemberRole.LEADER) {
      throw new ForbiddenException(
        'Chỉ trưởng nhóm có thể thực hiện thao tác này',
      );
    }
    if (member.groupId !== groupId || member.leftAt !== null) {
      throw new ConflictException('Thành viên nhóm đã thay đổi, vui lòng tải lại');
    }
    return member;
  }

  private async requireGroupConversation(
    repository: Repository<Conversation>,
    groupId: number,
  ): Promise<Conversation> {
    const conversation = await repository.findOneBy({ rentalGroupId: groupId });
    if (!conversation || conversation.type !== ConversationType.GROUP) {
      throw new ConflictException('Nhóm chưa có cuộc trò chuyện hợp lệ');
    }
    return conversation;
  }

  private async deactivateMember(
    repositories: GroupRepositories,
    group: RentalGroup,
    membership: GroupMember,
    activeCount: number,
  ): Promise<number> {
    const conversation = await this.requireGroupConversation(
      repositories.conversations,
      group.id,
    );
    const conversationMembership =
      await repositories.conversationMembers.findOne({
        where: {
          conversationId: conversation.id,
          userId: membership.studentId,
          leftAt: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
      });
    if (!conversationMembership) {
      throw new ConflictException('Dữ liệu thành viên chat chưa đồng bộ');
    }

    const now = new Date();
    const groupMemberUpdate = await repositories.members.update(
      {
        id: membership.id,
        groupId: group.id,
        studentId: membership.studentId,
        leftAt: IsNull(),
      },
      { leftAt: now },
    );
    if (!groupMemberUpdate.affected) {
      throw new ConflictException('Thành viên nhóm đã thay đổi, vui lòng tải lại');
    }

    const conversationMemberUpdate =
      await repositories.conversationMembers.update(
        {
          id: conversationMembership.id,
          conversationId: conversation.id,
          userId: membership.studentId,
          leftAt: IsNull(),
        },
        { leftAt: now },
      );
    if (!conversationMemberUpdate.affected) {
      throw new ConflictException('Thành viên chat đã thay đổi, vui lòng tải lại');
    }

    if (
      group.status === RentalGroupStatus.OPEN ||
      group.status === RentalGroupStatus.FULL
    ) {
      const status = this.capacityStatus(activeCount - 1, group.maxMembers);
      if (status !== group.status) {
        await repositories.groups.update({ id: group.id }, { status });
      }
    }
    return conversation.id;
  }

  private capacityStatus(
    activeMemberCount: number,
    maxMembers: number,
  ): RentalGroupStatus {
    return activeMemberCount >= maxMembers
      ? RentalGroupStatus.FULL
      : RentalGroupStatus.OPEN;
  }

  /** Maps each supported field explicitly instead of spreading request input. */
  private toUpdateValues(input: UpdateRentalGroupDto): Partial<RentalGroup> {
    const values: Partial<RentalGroup> = {};
    if (input.name !== undefined) values.name = input.name;
    if (input.maxMembers !== undefined) values.maxMembers = input.maxMembers;
    if (input.budgetPerPerson !== undefined) {
      values.budgetPerPerson = String(input.budgetPerPerson);
    }
    if (input.moveInDate !== undefined) values.moveInDate = input.moveInDate;
    if (input.rules !== undefined) values.rules = input.rules;
    if (input.zaloGroupUrl !== undefined) {
      values.zaloGroupUrl = input.zaloGroupUrl;
    }
    if (input.telegramGroupUrl !== undefined) {
      values.telegramGroupUrl = input.telegramGroupUrl;
    }
    return values;
  }
}
