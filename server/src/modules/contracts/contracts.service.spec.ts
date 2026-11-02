import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Contract,
  ContractTenant,
  Notification,
  Room,
  User,
} from '../../database/entities';
import {
  ContractStatus,
  NotificationType,
  RoomStatus,
  RoomType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { ContractsService } from './contracts.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const startDate = new Date('2099-01-01T00:00:00.000Z');
const endDate = new Date('2099-12-31T00:00:00.000Z');

function createUser(id: number, role = UserRole.STUDENT): User {
  return {
    id,
    username: `user-${id}`,
    email: `private-${id}@example.com`,
    passwordHash: 'private-password-hash',
    fullName: `Người dùng ${id}`,
    phone: '0900000000',
    avatarUrl: null,
    role,
    status: UserStatus.ACTIVE,
    verificationStatus: VerificationStatus.VERIFIED,
    createdAt,
    updatedAt,
  } as User;
}

function createRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 11,
    propertyId: 5,
    code: 'P101',
    name: 'Phòng 101',
    description: null,
    price: '2500000',
    deposit: '2500000',
    area: '20',
    capacity: 2,
    availableSlots: 2,
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
    property: {
      id: 5,
      landlordId: 9,
      slug: 'nha-tro-mau',
      name: 'Nhà trọ Mẫu',
      description: null,
      address: 'Hà Nội',
      ward: null,
      district: null,
      city: 'Hà Nội',
      latitude: '0',
      longitude: '0',
      rules: null,
      openingHours: null,
      contactPhone: null,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt,
      updatedAt,
    },
    ...overrides,
  } as Room;
}

function createTenant(overrides: Partial<ContractTenant> = {}): ContractTenant {
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
    student: createUser(7),
    ...overrides,
  } as ContractTenant;
}

function createContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 42,
    contractNumber: 'HD-2099-11-ABC12345',
    roomId: 11,
    landlordId: 9,
    startDate,
    endDate,
    rent: '2500000',
    deposit: '2500000',
    terms: 'Điều khoản hợp đồng thuê phòng mẫu.',
    status: ContractStatus.DRAFT,
    signedAt: null,
    terminatedAt: null,
    createdAt,
    updatedAt,
    room: createRoom(),
    landlord: createUser(9, UserRole.LANDLORD),
    tenants: [createTenant()],
    invoices: [
      {
        id: 81,
        invoiceNumber: 'INV-001',
        totalAmount: '2600000',
        status: 'UNPAID',
        dueDate: endDate,
        periodEnd: endDate,
      },
    ],
    ...overrides,
  } as Contract;
}

describe('ContractsService', () => {
  const contracts = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const tenants = { create: jest.fn(), find: jest.fn(), save: jest.fn() };
  const rooms = { findOne: jest.fn(), update: jest.fn() };
  const users = { find: jest.fn() };
  const notifications = { create: jest.fn(), save: jest.fn() };
  let transaction: jest.Mock;
  let service: ContractsService;

  beforeEach(() => {
    jest.resetAllMocks();
    contracts.create.mockImplementation((input: unknown) => input);
    tenants.create.mockImplementation((input: unknown) => input);
    notifications.create.mockImplementation((input: unknown) => input);

    const repositories = new Map<unknown, unknown>([
      [Contract, contracts],
      [ContractTenant, tenants],
      [Room, rooms],
      [User, users],
      [Notification, notifications],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new ContractsService(
      contracts as unknown as Repository<Contract>,
      { transaction } as unknown as DataSource,
    );
  });

  it('scopes a student list and presents no private account fields', async () => {
    const builder = {
      innerJoin: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      clone: jest.fn(),
      select: jest.fn(),
      orderBy: jest.fn(),
      addOrderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getRawMany: jest.fn(),
    };
    for (const method of [
      builder.innerJoin,
      builder.where,
      builder.andWhere,
      builder.select,
      builder.orderBy,
      builder.addOrderBy,
      builder.skip,
      builder.take,
    ]) {
      method.mockReturnValue(builder);
    }
    builder.clone.mockReturnValue({ getCount: jest.fn().mockResolvedValue(1) });
    builder.getRawMany.mockResolvedValue([{ id: 42 }]);
    contracts.createQueryBuilder.mockReturnValue(builder);
    contracts.find.mockResolvedValue([createContract()]);

    const result = await service.list(
      { id: 7, fullName: 'Sinh viên', role: UserRole.STUDENT },
      { page: 1, limit: 50 },
    );

    expect(builder.innerJoin).toHaveBeenCalledWith(
      'contract.tenants',
      'tenantScope',
      'tenantScope.student_id = :studentId',
      { studentId: 7 },
    );
    expect(result.data.items[0].tenants[0].student).not.toHaveProperty('email');
    expect(result.data.items[0].landlord).not.toHaveProperty('passwordHash');
    expect(result.meta).toEqual({ page: 1, limit: 50, total: 1, totalPages: 1 });
  });

  it('creates a draft under the room owner and selects exactly one explicit primary tenant', async () => {
    rooms.findOne.mockResolvedValue(createRoom());
    users.find.mockResolvedValue([createUser(7), createUser(8)]);
    contracts.findOneBy.mockResolvedValue(null);
    contracts.save.mockResolvedValue({ id: 42 });
    tenants.save.mockResolvedValue([]);
    contracts.findOne.mockResolvedValue(
      createContract({
        tenants: [
          createTenant({ studentId: 7, isPrimaryTenant: false }),
          createTenant({ id: 72, studentId: 8, isPrimaryTenant: true }),
        ],
      }),
    );

    await expect(
      service.create(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        {
          contractNumber: 'HD-2099-11-ABC12345',
          roomId: 11,
          startDate,
          endDate,
          rent: 2500000,
          deposit: 2500000,
          terms: 'Điều khoản hợp đồng thuê phòng mẫu.',
          tenants: [
            { studentId: 7, isPrimaryTenant: false },
            { studentId: 8, isPrimaryTenant: true },
          ],
        },
      ),
    ).resolves.toMatchObject({ id: 42, status: ContractStatus.DRAFT });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(rooms.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(contracts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        landlordId: 9,
        rent: '2500000',
        deposit: '2500000',
        status: ContractStatus.DRAFT,
      }),
    );
    expect(tenants.create).toHaveBeenCalledWith([
      expect.objectContaining({ studentId: 7, isPrimaryTenant: false }),
      expect.objectContaining({ studentId: 8, isPrimaryTenant: true }),
    ]);
  });

  it('rejects repeated students before a contract write', async () => {
    await expect(
      service.create(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        {
          roomId: 11,
          startDate,
          endDate,
          rent: 2500000,
          deposit: 0,
          terms: 'Điều khoản hợp đồng thuê phòng mẫu.',
          tenants: [{ studentId: 7 }, { studentId: 7 }],
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(transaction).not.toHaveBeenCalled();
    expect(contracts.save).not.toHaveBeenCalled();
  });

  it('activates a draft atomically, updates capacity, and notifies its tenants', async () => {
    const locked = createContract({ tenants: [] });
    const active = createContract({
      status: ContractStatus.ACTIVE,
      signedAt: updatedAt,
    });
    contracts.findOne.mockResolvedValueOnce(locked).mockResolvedValueOnce(active);
    rooms.findOne.mockResolvedValue(createRoom({ availableSlots: 2 }));
    tenants.find.mockResolvedValue([createTenant()]);
    rooms.update.mockResolvedValue({ affected: 1 });
    contracts.update.mockResolvedValue({ affected: 1 });
    notifications.save.mockResolvedValue([]);

    await expect(
      service.transition(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        42,
        { status: ContractStatus.ACTIVE },
      ),
    ).resolves.toMatchObject({ id: 42, status: ContractStatus.ACTIVE });

    expect(rooms.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11 }),
      expect.objectContaining({
        availableSlots: 1,
        status: RoomStatus.AVAILABLE,
      }),
    );
    expect(contracts.update).toHaveBeenCalledWith(
      { id: 42, status: ContractStatus.DRAFT },
      expect.objectContaining({ status: ContractStatus.ACTIVE }),
    );
    expect(notifications.create).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 7,
        type: NotificationType.CONTRACT,
      }),
    ]);
  });

  it('does not mutate a room or notify when capacity is insufficient', async () => {
    contracts.findOne.mockResolvedValue(createContract({ tenants: [] }));
    rooms.findOne.mockResolvedValue(createRoom({ availableSlots: 0 }));
    tenants.find.mockResolvedValue([createTenant()]);

    await expect(
      service.transition(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        42,
        { status: ContractStatus.ACTIVE },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(rooms.update).not.toHaveBeenCalled();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('expires a draft without changing room capacity or creating notifications', async () => {
    const expired = createContract({ status: ContractStatus.EXPIRED });
    contracts.findOne
      .mockResolvedValueOnce(createContract({ tenants: [] }))
      .mockResolvedValueOnce(expired);
    contracts.update.mockResolvedValue({ affected: 1 });

    await expect(
      service.transition(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        42,
        { status: ContractStatus.EXPIRED },
      ),
    ).resolves.toMatchObject({ status: ContractStatus.EXPIRED });

    expect(rooms.findOne).not.toHaveBeenCalled();
    expect(tenants.find).not.toHaveBeenCalled();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('does not disclose another tenant contract by ID', async () => {
    contracts.findOne.mockResolvedValue(createContract());

    await expect(
      service.getForUser(
        { id: 8, fullName: 'Khách', role: UserRole.STUDENT },
        42,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
