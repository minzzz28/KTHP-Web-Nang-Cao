import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Like, Repository } from 'typeorm';
import { Notification, Property, Room, User } from '../../database/entities';
import { NotificationType, RoomStatus, UserRole, UserStatus, VerificationStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { SetPropertyVerificationDto } from './dto/set-property-verification.dto';
import { SetRoomStatusDto } from './dto/set-room-status.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';

export interface AdminUserListResult {
  data: { items: ReturnType<typeof presentAdminUser>[] };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

type Repositories = {
  notifications: Repository<Notification>;
  properties: Repository<Property>;
  rooms: Repository<Room>;
  users: Repository<User>;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async listUsers(query: ListAdminUsersQueryDto): Promise<AdminUserListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const common: FindOptionsWhere<User> = {};
    if (query.role !== undefined) common.role = query.role;
    if (query.status !== undefined) common.status = query.status;
    const where = query.q
      ? (['username', 'fullName', 'email', 'phone'] as const).map((field) => ({ ...common, [field]: Like(`%${query.q}%`) }))
      : common;
    const [items, total] = await this.users.findAndCount({
      where,
      relations: { studentProfile: { university: true }, landlordProfile: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: { items: items.map(presentAdminUser) },
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async setUserStatus(actor: AuthenticatedUser, userId: number, input: SetUserStatusDto) {
    if (userId === actor.id && input.status === UserStatus.DISABLED) {
      throw new UnprocessableEntityException('Không thể tự khóa tài khoản admin đang sử dụng');
    }
    return this.dataSource.transaction(async (manager) => {
      const user = await this.repositories(manager).users.findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      if (!user) throw new NotFoundException('Không tìm thấy người dùng');
      const result = await this.repositories(manager).users.update({ id: user.id }, { status: input.status });
      if (!result.affected) throw new ConflictException('Người dùng đã thay đổi, vui lòng tải lại');
      return { id: user.id, username: user.username, fullName: user.fullName, email: user.email, role: user.role, status: input.status };
    });
  }

  async setRoomStatus(roomId: number, input: SetRoomStatusDto) {
    return this.dataSource.transaction(async (manager) => {
      const room = await this.repositories(manager).rooms.findOne({ where: { id: roomId }, lock: { mode: 'pessimistic_write' } });
      if (!room) throw new NotFoundException('Không tìm thấy phòng');
      const values: Partial<Room> = { status: input.status };
      if (input.status !== RoomStatus.HIDDEN) values.publishedAt = new Date();
      const result = await this.repositories(manager).rooms.update({ id: room.id }, values);
      if (!result.affected) throw new ConflictException('Phòng đã thay đổi, vui lòng tải lại');
      return { id: room.id, name: room.name, status: input.status };
    });
  }

  async setPropertyVerification(propertyId: number, input: SetPropertyVerificationDto) {
    return this.dataSource.transaction(async (manager) => {
      const repositories = this.repositories(manager);
      const property = await repositories.properties.findOne({ where: { id: propertyId }, lock: { mode: 'pessimistic_write' } });
      if (!property) throw new NotFoundException('Không tìm thấy khu trọ');
      if (![VerificationStatus.UNVERIFIED, VerificationStatus.PENDING].includes(property.verificationStatus)) {
        throw new ConflictException('Khu trọ này đã được xử lý xác minh');
      }
      const result = await repositories.properties.update({ id: property.id }, { verificationStatus: input.status });
      if (!result.affected) throw new ConflictException('Khu trọ vừa được một quản trị viên khác xử lý');
      await repositories.notifications.save(repositories.notifications.create({
        userId: property.landlordId,
        type: NotificationType.VERIFICATION,
        title: input.status === VerificationStatus.VERIFIED ? 'Khu trọ đã được xác minh' : 'Khu trọ chưa được duyệt',
        content: input.status === VerificationStatus.VERIFIED
          ? `Khu trọ ${property.name} của bạn đã được quản trị viên xác minh.`
          : `Khu trọ ${property.name} chưa được duyệt. Bạn có thể kiểm tra lại thông tin và liên hệ quản trị viên khi cần.`,
        linkUrl: '/landlord/properties',
        isRead: false,
        readAt: null,
      }));
      return { id: property.id, name: property.name, verificationStatus: input.status };
    });
  }

  private repositories(manager: EntityManager): Repositories {
    return {
      notifications: manager.getRepository(Notification),
      properties: manager.getRepository(Property),
      rooms: manager.getRepository(Room),
      users: manager.getRepository(User),
    };
  }
}

export function presentAdminUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt,
    studentProfile: user.studentProfile ? {
      studentCode: user.studentProfile.studentCode,
      university: user.studentProfile.university ? { id: user.studentProfile.university.id, name: user.studentProfile.university.name } : null,
    } : null,
    landlordProfile: user.landlordProfile ? { businessName: user.landlordProfile.businessName } : null,
  };
}
