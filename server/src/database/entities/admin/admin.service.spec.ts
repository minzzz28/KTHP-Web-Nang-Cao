import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notification, Property, Room, User } from '../../database/entities';
import { RoomStatus, UserRole, UserStatus, VerificationStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { AdminService } from './admin.service';

const admin: AuthenticatedUser = { id: 1, username: 'admin', email: 'admin@example.test', fullName: 'Quản trị viên', role: UserRole.ADMIN, status: UserStatus.ACTIVE };

describe('AdminService', () => {
  const notifications = { create: jest.fn(), save: jest.fn() };
  const properties = { findOne: jest.fn(), update: jest.fn() };
  const rooms = { findOne: jest.fn(), update: jest.fn() };
  const users = { findAndCount: jest.fn(), findOne: jest.fn(), update: jest.fn() };
  let service: AdminService;

  beforeEach(() => {
    jest.resetAllMocks();
    notifications.create.mockImplementation((value: unknown) => value);
    const map = new Map<unknown, unknown>([
      [Notification, notifications], [Property, properties], [Room, rooms], [User, users],
    ]);
    const manager = { getRepository: jest.fn((entity: unknown) => map.get(entity)) };
    const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));
    service = new AdminService(users as unknown as Repository<User>, { transaction } as unknown as DataSource);
  });

  it('does not let an admin disable their own active account', async () => {
    await expect(service.setUserStatus(admin, admin.id, { status: UserStatus.DISABLED }))
      .rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('locks and updates only the requested user status', async () => {
    users.findOne.mockResolvedValue({ id: 7, username: 'student', fullName: 'Sinh viên', email: 's@example.test', role: UserRole.STUDENT });
    users.update.mockResolvedValue({ affected: 1 });

    await expect(service.setUserStatus(admin, 7, { status: UserStatus.DISABLED }))
      .resolves.toMatchObject({ id: 7, status: UserStatus.DISABLED });
    expect(users.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
    expect(users.update).toHaveBeenCalledWith({ id: 7 }, { status: UserStatus.DISABLED });
  });

  it('publishes a visible room when its status is changed by admin', async () => {
    rooms.findOne.mockResolvedValue({ id: 5, name: 'P101' });
    rooms.update.mockResolvedValue({ affected: 1 });

    await service.setRoomStatus(5, { status: RoomStatus.AVAILABLE });

    expect(rooms.update).toHaveBeenCalledWith({ id: 5 }, expect.objectContaining({ status: RoomStatus.AVAILABLE, publishedAt: expect.any(Date) }));
  });

  it('will not process a property verification that was already final', async () => {
    properties.findOne.mockResolvedValue({ id: 4, verificationStatus: VerificationStatus.VERIFIED });

    await expect(service.setPropertyVerification(4, { status: VerificationStatus.REJECTED }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(properties.update).not.toHaveBeenCalled();
  });

  it('updates an eligible property once and notifies its landlord', async () => {
    properties.findOne.mockResolvedValue({ id: 4, name: 'Nhà trọ Mẫu', landlordId: 9, verificationStatus: VerificationStatus.PENDING });
    properties.update.mockResolvedValue({ affected: 1 });

    await expect(service.setPropertyVerification(4, { status: VerificationStatus.VERIFIED }))
      .resolves.toMatchObject({ id: 4, verificationStatus: VerificationStatus.VERIFIED });
    expect(properties.update).toHaveBeenCalledWith({ id: 4 }, { verificationStatus: VerificationStatus.VERIFIED });
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 9, type: 'VERIFICATION' }));
  });
});
