import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { ContractTenant, User } from '../../database/entities';
import {
  ContractStatus,
  RoomStatus,
  RoomType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { TenantsService } from './tenants.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

function createStudent(id = 7): User {
  return {
    id,
    username: `student-${id}`,
    email: `private-${id}@example.com`,
    passwordHash: 'private-password-hash',
    fullName: `Sinh viên ${id}`,
    phone: '0900000000',
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    verificationStatus: VerificationStatus.VERIFIED,
    createdAt,
    updatedAt,
    studentProfile: {
      id: 1,
      userId: id,
      studentCode: 'SV-PRIVATE',
      universityId: null,
      schoolEmail: 'private-school@example.com',
      faculty: 'Công nghệ thông tin',
      academicYear: 'K66',
      hometown: null,
      bio: null,
      createdAt,
      updatedAt,
    },
  } as User;
}

function createTenant(): ContractTenant {
  return {
    id: 71,
    contractId: 42,
    studentId: 7,
    isPrimaryTenant: true,
    moveInDate: null,
    moveOutDate: null,
    signedAt: null,
    createdAt,
    updatedAt,
    student: createStudent(),
    contract: {
      id: 42,
      contractNumber: 'HD-2099-11-ABC12345',
      startDate: new Date('2099-01-01T00:00:00.000Z'),
      endDate: new Date('2099-12-31T00:00:00.000Z'),
      status: ContractStatus.ACTIVE,
      room: {
        id: 11,
        propertyId: 5,
        code: 'P101',
        name: 'Phòng 101',
        description: null,
        price: '2500000',
        deposit: '2500000',
        area: '20',
        capacity: 2,
        availableSlots: 1,
        type: RoomType.PRIVATE_ROOM,
        status: RoomStatus.AVAILABLE,
        electricityPrice: '3500',
        waterPrice: '20000',
        internetFee: '100000',
        parkingFee: '50000',
        serviceFee: '0',
        locationScore: null,
        publishedAt: null,
        createdAt,
        updatedAt,
      },
    },
  } as unknown as ContractTenant;
}

describe('TenantsService', () => {
  const tenants = { findAndCount: jest.fn() };
  const users = { findAndCount: jest.fn() };
  let service: TenantsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new TenantsService(
      tenants as unknown as Repository<ContractTenant>,
      users as unknown as Repository<User>,
    );
  });

  it('returns active student candidates without contact data or private profiles', async () => {
    users.findAndCount.mockResolvedValue([[createStudent()], 1]);

    const result = await service.list(
      { id: 9, role: UserRole.LANDLORD },
      { candidates: true, page: 1, limit: 50 },
    );

    expect(users.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { role: UserRole.STUDENT, status: UserStatus.ACTIVE },
        take: 50,
      }),
    );
    const candidate = result.data.items[0];
    expect(candidate).toMatchObject({ id: 7, studentId: 7 });
    expect(candidate.student).not.toHaveProperty('email');
    expect(candidate.student).not.toHaveProperty('phone');
    expect(candidate.student).not.toHaveProperty('passwordHash');
    expect(candidate.student).not.toHaveProperty('studentProfile.studentCode');
    expect(candidate.student?.user).not.toHaveProperty('email');
  });

  it('limits a landlord to tenants of their own contracts', async () => {
    tenants.findAndCount.mockResolvedValue([[createTenant()], 1]);

    const result = await service.list(
      { id: 9, role: UserRole.LANDLORD },
      { candidates: false, page: 1, limit: 50 },
    );

    expect(tenants.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contract: { landlordId: 9 } },
        take: 50,
      }),
    );
    expect(result.data.items[0]).toMatchObject({
      id: 71,
      contractId: 42,
      room: { id: 11, name: 'Phòng 101' },
      contract: { status: ContractStatus.ACTIVE },
    });
    expect(result.data.items[0].student).not.toHaveProperty('email');
  });

  it('does not allow a student to list tenants or global candidates', async () => {
    await expect(
      service.list(
        { id: 7, role: UserRole.STUDENT },
        { candidates: true, page: 1, limit: 50 },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(users.findAndCount).not.toHaveBeenCalled();
    expect(tenants.findAndCount).not.toHaveBeenCalled();
  });

  it('accepts the legacy candidates=1 query value', async () => {
    const input = plainToInstance(ListTenantsQueryDto, {
      candidates: '1',
      page: '1',
      limit: '50',
    });

    expect(await validate(input)).toHaveLength(0);
    expect(input.candidates).toBe(true);
  });
});
