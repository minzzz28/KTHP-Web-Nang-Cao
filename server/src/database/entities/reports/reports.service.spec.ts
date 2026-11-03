import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notification, Report, Review, Room, RoommatePost, User } from '../../database/entities';
import { ReportReason, ReportStatus, ReportTargetType, UserRole, UserStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { ReportsService } from './reports.service';

const reporter: AuthenticatedUser = { id: 7, username: 'student', email: 'student@example.test', fullName: 'Sinh viên A', role: UserRole.STUDENT, status: UserStatus.ACTIVE };
const admin: AuthenticatedUser = { id: 1, username: 'admin', email: 'admin@example.test', fullName: 'Quản trị viên', role: UserRole.ADMIN, status: UserStatus.ACTIVE };

function report(status = ReportStatus.PENDING): Report {
  return {
    id: 30, reporterId: reporter.id, targetType: ReportTargetType.ROOM, targetUserId: null, roomId: 5,
    roommatePostId: null, reviewId: null, reason: ReportReason.WRONG_INFO, description: 'Không đúng mô tả',
    evidenceUrl: null, status, reviewedById: null, adminNote: null, resolvedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as Report;
}

describe('ReportsService', () => {
  const notifications = { create: jest.fn(), save: jest.fn() };
  const reports = { create: jest.fn(), findAndCount: jest.fn(), findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
  const reviews = { findOne: jest.fn() };
  const rooms = { findOne: jest.fn() };
  const roommatePosts = { findOne: jest.fn() };
  const users = { findOne: jest.fn() };
  let service: ReportsService;

  beforeEach(() => {
    jest.resetAllMocks();
    reports.create.mockImplementation((value: unknown) => value);
    notifications.create.mockImplementation((value: unknown) => value);
    const map = new Map<unknown, unknown>([
      [Notification, notifications], [Report, reports], [Review, reviews], [Room, rooms], [RoommatePost, roommatePosts], [User, users],
    ]);
    const manager = { getRepository: jest.fn((entity: unknown) => map.get(entity)) };
    const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));
    service = new ReportsService(reports as unknown as Repository<Report>, { transaction } as unknown as DataSource);
  });

  it('requires exactly one target matching the chosen target type', async () => {
    await expect(service.create(reporter, {
      targetType: ReportTargetType.ROOM, roomId: 5, reviewId: 12, reason: ReportReason.WRONG_INFO,
    })).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(reports.save).not.toHaveBeenCalled();
  });

  it('does not allow a user to report themselves', async () => {
    await expect(service.create(reporter, {
      targetType: ReportTargetType.USER, targetUserId: reporter.id, reason: ReportReason.FAKE_ACCOUNT,
    })).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(reports.save).not.toHaveBeenCalled();
  });

  it('binds a report to the verified target rather than arbitrary input fields', async () => {
    rooms.findOne.mockResolvedValue({ id: 5, status: 'AVAILABLE' });
    reports.save.mockResolvedValue({ id: 30 });
    reports.findOne.mockResolvedValue(report());

    await service.create(reporter, {
      targetType: ReportTargetType.ROOM, roomId: 5, reason: ReportReason.WRONG_INFO,
    });

    expect(rooms.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_read' } }));
    expect(reports.create).toHaveBeenCalledWith(expect.objectContaining({ reporterId: reporter.id, roomId: 5, targetUserId: null, status: ReportStatus.PENDING }));
  });

  it('scopes a non-admin list to reports made by that user', async () => {
    reports.findAndCount.mockResolvedValue([[], 0]);

    await service.list(reporter, { page: 1, limit: 20 });

    expect(reports.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: { reporterId: reporter.id } }));
  });

  it('will not reopen a report that was already resolved', async () => {
    reports.findOne.mockResolvedValue(report(ReportStatus.RESOLVED));

    await expect(service.process(admin, 30, { status: ReportStatus.PROCESSING, adminNote: 'Mở lại' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(reports.update).not.toHaveBeenCalled();
  });
});
