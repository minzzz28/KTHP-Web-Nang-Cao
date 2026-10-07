import {
  ConflictException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import {
  LandlordProfile,
  StudentProfile,
  User,
} from '../../database/entities';
import { UserRole, UserStatus, VerificationStatus } from '../../database/enums/domain.enums';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const bcryptMock = jest.mocked(bcrypt);

function createUser(): User {
  return {
    id: 7,
    username: 'sinhvien',
    email: 'sv@example.com',
    passwordHash: 'stored-password-hash',
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
      schoolEmail: 'sv@school.edu.vn',
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

describe('AuthService', () => {
  const users = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };
  const transactionUsers = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const studentProfiles = { save: jest.fn() };
  const landlordProfiles = { save: jest.fn() };
  const manager = {
    getRepository: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };
  const jwtService = { signAsync: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    manager.getRepository.mockImplementation((entity: unknown) => {
      if (entity === User) return transactionUsers;
      if (entity === StudentProfile) return studentProfiles;
      return landlordProfiles;
    });
    dataSource.transaction.mockImplementation(
      async (run: (entityManager: typeof manager) => Promise<number>) =>
        run(manager),
    );
    transactionUsers.create.mockImplementation((input) => input);
    service = new AuthService(
      users as unknown as Repository<User>,
      dataSource as unknown as DataSource,
      jwtService as unknown as JwtService,
    );
  });

  it('signs HS256 token and never returns a password hash after login', async () => {
    const user = createUser();
    users.findOne.mockResolvedValue(user);
    bcryptMock.compare.mockResolvedValue(true as never);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await service.login({
      identifier: 'sinhvien',
      password: 'correct-password',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { role: UserRole.STUDENT },
      { subject: '7', algorithm: 'HS256' },
    );
    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'signed-token',
        user: expect.not.objectContaining({ passwordHash: expect.anything() }),
      }),
    );
    expect(result.user.studentProfile?.university).toEqual({
      id: 1,
      code: 'PKA',
      name: 'Đại học Phenikaa',
    });
  });

  it('uses a generic 401 and still performs bcrypt work for an absent account', async () => {
    users.findOne.mockResolvedValue(null);
    bcryptMock.compare.mockResolvedValue(false as never);

    await expect(
      service.login({ identifier: 'missing', password: 'any-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(bcryptMock.compare).toHaveBeenCalledWith(
      'any-password',
      expect.stringMatching(/^\$2b\$12\$/),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects a login that does not provide an identifier with a 422 error', async () => {
    await expect(
      service.login({ password: 'any-password' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(users.findOne).not.toHaveBeenCalled();
  });

  it('creates a student profile atomically when registering a student', async () => {
    const user = createUser();
    transactionUsers.findOneBy.mockResolvedValue(null);
    transactionUsers.save.mockResolvedValue(user);
    users.findOne.mockResolvedValue(user);
    bcryptMock.hash.mockResolvedValue('new-password-hash' as never);
    jwtService.signAsync.mockResolvedValue('registered-token');

    await expect(
      service.register({
        username: 'newstudent',
        password: 'new-password',
        fullName: 'Sinh viên mới',
        role: UserRole.STUDENT,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ accessToken: 'registered-token' }),
    );

    expect(transactionUsers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'newstudent',
        passwordHash: 'new-password-hash',
        role: UserRole.STUDENT,
      }),
    );
    expect(studentProfiles.save).toHaveBeenCalledWith({ userId: 7 });
    expect(landlordProfiles.save).not.toHaveBeenCalled();
  });

  it('converts a unique-key race into a conflict response', async () => {
    dataSource.transaction.mockRejectedValue({
      code: 'ER_DUP_ENTRY',
      message: "Duplicate entry for key 'users_phone_key'",
    });
    bcryptMock.hash.mockResolvedValue('new-password-hash' as never);

    await expect(
      service.register({
        email: 'student@example.com',
        phone: '0900000000',
        password: 'new-password',
        fullName: 'Sinh viên',
      }),
    ).rejects.toMatchObject<Partial<ConflictException>>({
      message: 'Số điện thoại đã được sử dụng',
    });
  });

  it('hashes a changed password with the configured bcrypt cost', async () => {
    const user = createUser();
    users.findOneBy.mockResolvedValue(user);
    bcryptMock.compare.mockResolvedValue(true as never);
    bcryptMock.hash.mockResolvedValue('changed-password-hash' as never);

    await service.changePassword(7, {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(bcryptMock.hash).toHaveBeenCalledWith('new-password', 12);
    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: 'changed-password-hash' }),
    );
  });
});
