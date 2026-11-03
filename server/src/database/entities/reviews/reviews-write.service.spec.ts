import { ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Contract, ContractTenant, Notification, Review } from '../../database/entities';
import { ContractStatus, ReviewStatus, UserRole, UserStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { ReviewsService } from './reviews.service';

const student: AuthenticatedUser = {
  id: 7,
  username: 'student-7',
  email: 'student@example.test',
  fullName: 'Sinh viên A',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

const admin: AuthenticatedUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.test',
  fullName: 'Quản trị viên',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
};

function contract(): Contract {
  return {
    id: 20,
    contractNumber: 'HD-20',
    roomId: 5,
    landlordId: 9,
    status: ContractStatus.TERMINATED,
  } as Contract;
}

function review(studentId = student.id): Review {
  return {
    id: 31,
    contractId: 20,
    studentId,
    roomId: 5,
    landlordId: 9,
    rating: 5,
    roomQuality: 5,
    security: 5,
    cleanliness: 5,
    wifiQuality: 4,
    utilityPrice: 4,
    listingAccuracy: 5,
    landlordAttitude: 5,
    comment: 'Đúng mô tả',
    status: ReviewStatus.PUBLISHED,
    moderatedById: null,
    moderationNote: null,
    moderatedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as Review;
}

describe('ReviewsService write operations', () => {
  const contracts = { findOne: jest.fn() };
  const contractTenants = { findOne: jest.fn() };
  const notifications = { create: jest.fn(), save: jest.fn() };
  const reviews = { create: jest.fn(), findAndCount: jest.fn(), findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
  let service: ReviewsService;

  beforeEach(() => {
    jest.resetAllMocks();
    reviews.create.mockImplementation((value: unknown) => value);
    notifications.create.mockImplementation((value: unknown) => value);
    const repositories = new Map<unknown, unknown>([
      [Contract, contracts],
      [ContractTenant, contractTenants],
      [Notification, notifications],
      [Review, reviews],
    ]);
    const manager = { getRepository: jest.fn((entity: unknown) => repositories.get(entity)) };
    const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));
    service = new ReviewsService(reviews as unknown as Repository<Review>, { transaction } as unknown as DataSource);
  });

  it('refuses a review from a student who is not listed on the contract', async () => {
    contracts.findOne.mockResolvedValue(contract());
    contractTenants.findOne.mockResolvedValue(null);

    await expect(service.create(student, { contractId: 20, rating: 5, roomQuality: 5, security: 5, cleanliness: 5, wifiQuality: 4, utilityPrice: 4, listingAccuracy: 5, landlordAttitude: 5 }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(reviews.save).not.toHaveBeenCalled();
  });

  it('uses the contract data rather than client-controlled room and landlord values', async () => {
    contracts.findOne.mockResolvedValue(contract());
    contractTenants.findOne.mockResolvedValue({ contractId: 20, studentId: student.id });
    reviews.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(review());
    reviews.save.mockResolvedValue({ id: 31 });

    await service.create(student, { contractId: 20, rating: 5, roomQuality: 5, security: 5, cleanliness: 5, wifiQuality: 4, utilityPrice: 4, listingAccuracy: 5, landlordAttitude: 5 });

    expect(reviews.create).toHaveBeenCalledWith(expect.objectContaining({ roomId: 5, landlordId: 9, studentId: student.id }));
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 9 }));
  });

  it('does not let another student edit the review', async () => {
    reviews.findOne.mockResolvedValue(review(99));

    await expect(service.update(student, 31, { comment: 'Sửa hộ' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(reviews.update).not.toHaveBeenCalled();
  });

  it('records the moderator and notifies the author when an admin hides a review', async () => {
    reviews.findOne.mockResolvedValueOnce(review()).mockResolvedValueOnce({ ...review(), status: ReviewStatus.HIDDEN, moderatedById: admin.id });
    reviews.update.mockResolvedValue({ affected: 1 });

    await service.moderate(admin, 31, { status: ReviewStatus.HIDDEN, moderationNote: 'Nội dung cần xem lại' });

    expect(reviews.update).toHaveBeenCalledWith({ id: 31 }, expect.objectContaining({ status: ReviewStatus.HIDDEN, moderatedById: admin.id }));
    expect(notifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: student.id }));
  });
});
