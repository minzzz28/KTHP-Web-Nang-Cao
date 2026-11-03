import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import {
  RoommateProfile,
  University,
} from '../../database/entities';
import {
  Gender,
  SocialPreference,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { RoommatesService } from './roommates.service';
import { UpdateRoommateProfileDto } from './dto/update-roommate-profile.dto';

function createProfile(): RoommateProfile {
  return {
    id: 12,
    studentId: 7,
    universityId: 3,
    gender: Gender.FEMALE,
    hometown: 'Đà Nẵng',
    faculty: 'Công nghệ thông tin',
    academicYear: 'K20',
    budgetMin: '2000000.00',
    budgetMax: '3500000.00',
    preferredArea: 'Cầu Giấy',
    maxDistanceKm: '4.00',
    isSmoking: false,
    acceptsSmoking: false,
    hasPets: false,
    acceptsPets: true,
    cooksOften: true,
    sleepTime: '23:00',
    wakeUpTime: '07:00',
    cleanlinessLevel: 4,
    socialPreference: SocialPreference.BALANCED,
    preferredRoommates: 1,
    bio: 'Gọn gàng',
    isVisible: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    student: {
      id: 7,
      username: 'student-7',
      email: 'private@example.com',
      passwordHash: 'private-password-hash',
      fullName: 'Sinh viên Bảy',
      phone: '0900000000',
      avatarUrl: null,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    university: {
      id: 3,
      code: 'HUST',
      name: 'Đại học Bách khoa Hà Nội',
      address: 'Hà Nội',
      latitude: '21.0',
      longitude: '105.0',
      website: null,
      isPrimary: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  } as RoommateProfile;
}

describe('RoommatesService', () => {
  const profiles = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const universities = { findOneBy: jest.fn() };
  let service: RoommatesService;

  beforeEach(() => {
    jest.resetAllMocks();
    profiles.create.mockImplementation((input) => input);
    service = new RoommatesService(
      profiles as unknown as Repository<RoommateProfile>,
      universities as unknown as Repository<University>,
    );
  });

  it('returns null when the authenticated student has not created a profile', async () => {
    profiles.findOne.mockResolvedValue(null);

    await expect(service.mine(7)).resolves.toBeNull();
    expect(profiles.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 7 } }),
    );
  });

  it('presents only public account fields', async () => {
    profiles.findOne.mockResolvedValue(createProfile());

    const result = await service.mine(7);

    expect(result).toEqual(
      expect.objectContaining({ id: 12, studentId: 7, minBudget: '2000000.00' }),
    );
    expect(result).not.toHaveProperty('passwordHash');
    expect(result?.user).not.toHaveProperty('email');
    expect(result?.user).not.toHaveProperty('phone');
    expect(result?.student?.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a missing university before saving a new profile', async () => {
    universities.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(7, {
        gender: Gender.FEMALE,
        universityId: 999,
        budgetMin: 2_000_000,
        budgetMax: 3_000_000,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(profiles.save).not.toHaveBeenCalled();
  });

  it('rejects an invalid budget range before saving an update', async () => {
    profiles.findOneBy.mockResolvedValue(createProfile());

    await expect(
      service.update(7, { budgetMin: 3_000_000, budgetMax: 2_000_000 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(profiles.save).not.toHaveBeenCalled();
  });

  it('rejects null for non-nullable update fields before they reach the database', async () => {
    const input = plainToInstance(UpdateRoommateProfileDto, {
      budgetMin: null,
      gender: null,
      isSmoking: null,
    });

    const errors = await validate(input);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['budgetMin', 'gender', 'isSmoking']),
    );
  });

  it('binds search text as a TypeORM parameter', async () => {
    const builder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    profiles.createQueryBuilder.mockReturnValue(builder);

    await service.list({
      preferredArea: "x' OR 1=1 --",
      page: 1,
      limit: 12,
    });

    expect(builder.andWhere).toHaveBeenCalledWith(
      'profile.preferredArea LIKE :preferredArea',
      { preferredArea: "%x' OR 1=1 --%" },
    );
  });
});
