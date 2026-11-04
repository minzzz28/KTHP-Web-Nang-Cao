import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notification, StudentProfile, User, VerificationRequest } from '../../database/entities';
import { UserRole, UserStatus, VerificationStatus, VerificationType } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { VerificationsService } from './verifications.service';

const student: AuthenticatedUser = { id: 7, username: 'student', email: 'student@example.test', fullName: 'Sinh viên A', role: UserRole.STUDENT, status: UserStatus.ACTIVE };
const admin: AuthenticatedUser = { id: 1, username: 'admin', email: 'admin@example.test', fullName: 'Quản trị viên', role: UserRole.ADMIN, status: UserStatus.ACTIVE };

function request(status = VerificationStatus.PENDING): VerificationRequest {
  return {
    id: 41, userId: student.id, reviewedById: null, type: VerificationType.STUDENT, status,
    studentCode: 'SV-007', schoolEmail: 'sv007@school.example', documentUrl: null, note: null,
    reviewerNote: null, reviewedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as VerificationRequest;
}

describe('VerificationsService', () => {
  const notifications = { create: jest.fn(), save: jest.fn() };
  const requests = { create: jest.fn(), findAndCount: jest.fn(), findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
  const studentProfiles = { create: jest.fn(), findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
  const users = { findOne: jest.fn(), update: jest.fn() };
  let service: VerificationsService;

  beforeEach(() => {
    jest.resetAllMocks();
    requests.create.mockImplementation((value: unknown) => value);
    notifications.create.mockImplementation((value: unknown) => value);
    studentProfiles.create.mockImplementation((value: unknown) => value);
    const map = new Map<unknown, unknown>([
      [Notification, notifications], [StudentProfile, studentProfiles], [User, users], [VerificationRequest, requests],
    ]);
    const manager = { getRepository: jest.fn((entity: unknown) => map.get(entity)) };
    const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));
    service = new VerificationsService(requests as unknown as Repository<VerificationRequest>, { transaction } as unknown as DataSource);
  });

  it('refuses a verification type that does not match the authenticated account', async () => {
    await expect(service.submit(student, { type: VerificationType.LANDLORD, note: 'Giấy tờ' }))
      .rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(requests.save).not.toHaveBeenCalled();
  });

  it('does not create a second pending request for the same account', async () => {
    users.findOne.mockResolvedValue({ id: student.id });
    requests.findOne.mockResolvedValue(request());

    await expect(service.submit(student, { type: VerificationType.STUDENT, studentCode: 'SV-007' }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(requests.save).not.toHaveBeenCalled();
  });

  it('creates a pending request under the authenticated user only', async () => {
    users.findOne.mockResolvedValue({ id: student.id });
    requests.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(request());
    requests.save.mockResolvedValue({ id: 41 });

    await service.submit(student, { type: VerificationType.STUDENT, studentCode: 'SV-007' });

    expect(requests.create).toHaveBeenCalledWith(expect.objectContaining({ userId: student.id, status: VerificationStatus.PENDING, reviewedById: null }));
    expect(users.update).toHaveBeenCalledWith({ id: student.id }, { verificationStatus: VerificationStatus.PENDING });
  });

  it('refuses to verify a student code owned by another account', async () => {
    requests.findOne.mockResolvedValue(request());
    users.findOne.mockResolvedValue({ id: student.id });
    studentProfiles.findOne.mockResolvedValue({ userId: 99 });

    await expect(service.review(admin, 41, { status: VerificationStatus.VERIFIED }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(requests.update).not.toHaveBeenCalled();
  });

  it('writes the reviewer, account status, student profile, and notification together', async () => {
    requests.findOne.mockResolvedValueOnce(request()).mockResolvedValueOnce({ ...request(), status: VerificationStatus.VERIFIED, reviewedById: admin.id });
    users.findOne.mockResolvedValue({ id: student.id });
    studentProfiles.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    requests.update.mockResolvedValue({ affected: 1 });

    await service.review(admin, 41, { status: VerificationStatus.VERIFIED, reviewerNote: 'Đã đối chiếu' });

    expect(studentProfiles.create).toHaveBeenCalledWith(expect.objectContaining({ userId: student.id, studentCode: 'SV-007' }));
    expect(requests.update).toHaveBeenCalledWith({ id: 41 }, expect.objectContaining({ status: VerificationStatus.VERIFIED, reviewedById: admin.id }));
    expect(users.update).toHaveBeenLastCalledWith({ id: student.id }, { verificationStatus: VerificationStatus.VERIFIED });
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: student.id, type: 'VERIFICATION' }));
  });
});
