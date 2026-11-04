import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  LandlordProfile,
  StudentProfile,
  University,
  User,
} from '../../database/entities';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { UsersService } from './users.service';

function createUser(): User {
  return {
    id: 7,
    username: 'sinhvien',
    email: 'private@example.com',
    passwordHash: 'private-password-hash',
    fullName: 'Sinh viên A',
    phone: '0900000000',
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    verificationStatus: VerificationStatus.UNVERIFIED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    studentProfile: {
      id: 17,
      userId: 7,
      studentCode: 'SV001',
      universityId: 1,
      schoolEmail: 'private@school.edu.vn',
      faculty: 'CNTT',
      academicYear: '2024',
      hometown: null,
      bio: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      university: {
        id: 1,
        code: 'PKA',
        name: 'Đại học Phenikaa',
        address: 'Hà Nội',
        latitude: '20.0',
        longitude: '105.0',
        website: null,
        isPrimary: true,
      },
    } as StudentProfile,
    landlordProfile: undefined,
  } as User;
}

const studentUser: AuthenticatedUser = {
  id: 7,
  username: 'sinhvien',
  email: 'private@example.com',
  fullName: 'Sinh viên A',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

describe('UsersService', () => {
  const users = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const studentProfiles = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const landlordProfiles = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const universities = { findOneBy: jest.fn() };
  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    studentProfiles.create.mockImplementation((input) => input);
    landlordProfiles.create.mockImplementation((input) => input);
    service = new UsersService(
      users as unknown as Repository<User>,
      studentProfiles as unknown as Repository<StudentProfile>,
      landlordProfiles as unknown as Repository<LandlordProfile>,
      universities as unknown as Repository<University>,
    );
  });

  it('does not allow an account update to take a phone number owned by another user', async () => {
    users.findOne.mockResolvedValue({ id: 8 });

    await expect(
      service.updateAccount(7, { phone: '0911111111' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(users.update).not.toHaveBeenCalled();
  });

  it('rejects a supplied userId instead of ever using it for a student profile', async () => {
    await expect(
      service.updateProfile(studentUser, { userId: 999, faculty: 'CNTT' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(studentProfiles.save).not.toHaveBeenCalled();
  });

  it('creates a missing student profile with the authenticated user ID only', async () => {
    studentProfiles.findOneBy.mockResolvedValue(null);
    studentProfiles.save.mockResolvedValue(undefined);
    users.findOne.mockResolvedValue(createUser());

    await service.updateProfile(studentUser, { faculty: 'CNTT' });

    expect(studentProfiles.create).toHaveBeenCalledWith({
      userId: 7,
      faculty: 'CNTT',
    });
    expect(studentProfiles.save).toHaveBeenCalled();
  });

  it('does not expose private account or profile fields in a public profile', async () => {
    users.findOne.mockResolvedValue(createUser());

    const result = await service.getPublicProfile(7);

    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phone');
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.studentProfile).not.toHaveProperty('studentCode');
    expect(result.studentProfile).not.toHaveProperty('schoolEmail');
  });
});
