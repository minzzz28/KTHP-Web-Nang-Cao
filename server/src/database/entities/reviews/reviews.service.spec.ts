import { DataSource, Repository } from 'typeorm';
import { Review } from '../../database/entities';
import { ReviewStatus, UserRole, UserStatus, VerificationStatus } from '../../database/enums/domain.enums';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  const reviewsRepository = { findAndCount: jest.fn() };
  let service: ReviewsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ReviewsService(
      reviewsRepository as unknown as Repository<Review>,
      {} as DataSource,
    );
  });

  it('lists only published reviews for the requested room', async () => {
    reviewsRepository.findAndCount.mockResolvedValue([
      [
        {
        id: 7,
        contractId: 3,
        studentId: 2,
        roomId: 1,
        landlordId: 4,
        rating: 5,
        roomQuality: 5,
        security: 5,
        cleanliness: 5,
        wifiQuality: 4,
        utilityPrice: 4,
        listingAccuracy: 5,
        landlordAttitude: 5,
        comment: 'Phòng đúng mô tả',
        status: ReviewStatus.PUBLISHED,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        updatedAt: new Date('2026-09-01T00:00:00.000Z'),
        student: {
          id: 2,
          username: 'student',
          passwordHash: 'must-not-be-returned',
          fullName: 'Sinh viên A',
          avatarUrl: null,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        landlord: {
          id: 4,
          username: 'landlord',
          passwordHash: 'must-not-be-returned',
          fullName: 'Chủ trọ A',
          avatarUrl: null,
          role: UserRole.LANDLORD,
          status: UserStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
          room: { id: 1, name: 'P101', code: 'P101' },
        },
      ],
      1,
    ]);

    await expect(
      service.list({ roomId: 1, page: 1, limit: 20 }),
    ).resolves.toMatchObject({
      data: {
        items: [
          expect.objectContaining({
            id: 7,
            student: expect.not.objectContaining({ passwordHash: expect.anything() }),
          }),
        ],
      },
      meta: { total: 1 },
    });
    expect(reviewsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: ReviewStatus.PUBLISHED, roomId: 1 },
        take: 20,
      }),
    );
  });
});
