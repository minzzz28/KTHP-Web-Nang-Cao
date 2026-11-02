import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Contract,
  ContractTenant,
  Invoice,
  InvoiceItem,
  Notification,
  Room,
  User,
} from '../../database/entities';
import {
  ContractStatus,
  InvoiceItemType,
  InvoiceStatus,
  NotificationType,
  RoomStatus,
  RoomType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { InvoicesService } from './invoices.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const periodStart = new Date('2099-01-01T00:00:00.000Z');
const periodEnd = new Date('2099-01-31T00:00:00.000Z');
const dueDate = new Date('2099-02-10T00:00:00.000Z');

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

function createRoom(): Room {
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
  } as unknown as ContractTenant;
}

function createContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 42,
    contractNumber: 'HD-2099-11-ABC12345',
    roomId: 11,
    landlordId: 9,
    startDate: periodStart,
    endDate: new Date('2099-12-31T00:00:00.000Z'),
    rent: '2500000.00',
    deposit: '2500000.00',
    terms: 'Điều khoản hợp đồng thuê phòng mẫu.',
    status: ContractStatus.ACTIVE,
    signedAt: createdAt,
    terminatedAt: null,
    createdAt,
    updatedAt,
    room: createRoom(),
    landlord: createUser(9, UserRole.LANDLORD),
    tenants: [createTenant()],
    invoices: [],
    ...overrides,
  } as Contract;
}

function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 101,
    invoiceNumber: 'HD-42-20990131-ABCDEF',
    contractId: 42,
    periodStart,
    periodEnd,
    dueDate,
    electricityStart: '10.00',
    electricityEnd: '12.00',
    electricityUsage: '2.00',
    electricityUnitPrice: '3500.00',
    electricityAmount: '7000.00',
    waterStart: '1.00',
    waterEnd: '2.00',
    waterUsage: '1.00',
    waterUnitPrice: '20000.00',
    waterAmount: '20000.00',
    rentAmount: '2500000.00',
    internetAmount: '100000.00',
    parkingAmount: '50000.00',
    serviceAmount: '0.00',
    otherAmount: '10000.00',
    totalAmount: '2687000.00',
    status: InvoiceStatus.UNPAID,
    issuedAt: createdAt,
    paidAt: null,
    createdAt,
    updatedAt,
    contract: createContract(),
    items: [],
    ...overrides,
  } as Invoice;
}

describe('InvoicesService', () => {
  const contracts = { findOne: jest.fn() };
  const tenants = { find: jest.fn() };
  const invoices = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const invoiceItems = { create: jest.fn(), save: jest.fn() };
  const notifications = { create: jest.fn(), save: jest.fn() };
  let transaction: jest.Mock;
  let service: InvoicesService;

  beforeEach(() => {
    jest.resetAllMocks();
    invoices.create.mockImplementation((input: unknown) => input);
    invoiceItems.create.mockImplementation((input: unknown) => input);
    notifications.create.mockImplementation((input: unknown) => input);

    const repositories = new Map<unknown, unknown>([
      [Contract, contracts],
      [ContractTenant, tenants],
      [Invoice, invoices],
      [InvoiceItem, invoiceItems],
      [Notification, notifications],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new InvoicesService(
      invoices as unknown as Repository<Invoice>,
      { transaction } as unknown as DataSource,
    );
  });

  it('scopes a student list and does not present private user data', async () => {
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
    builder.getRawMany.mockResolvedValue([{ id: 101 }]);
    invoices.createQueryBuilder.mockReturnValue(builder);
    invoices.find.mockResolvedValue([createInvoice()]);
    invoices.update.mockResolvedValue({ affected: 0 });

    const result = await service.list(
      { id: 7, fullName: 'Sinh viên', role: UserRole.STUDENT },
      { page: 1, limit: 50 },
    );

    expect(builder.innerJoin).toHaveBeenCalledWith(
      'contractScope.tenants',
      'tenantScope',
      'tenantScope.student_id = :studentId',
      { studentId: 7 },
    );
    expect(result.data.items[0].contract?.landlord).not.toHaveProperty('email');
    expect(result.data.items[0].contract?.tenants[0].student).not.toHaveProperty(
      'passwordHash',
    );
    expect(result.meta).toEqual({ page: 1, limit: 50, total: 1, totalPages: 1 });
  });

  it('creates a calculated invoice, item rows, and tenant notification in one transaction', async () => {
    contracts.findOne.mockResolvedValue(createContract({ tenants: [] }));
    invoices.findOneBy.mockResolvedValue(null);
    invoices.save.mockResolvedValue({ id: 101, invoiceNumber: 'HD-42-20990131-ABCDEF' });
    invoiceItems.save.mockResolvedValue([]);
    tenants.find.mockResolvedValue([createTenant()]);
    notifications.save.mockResolvedValue([]);
    invoices.findOne.mockResolvedValue(createInvoice());

    await expect(
      service.create(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        {
          contractId: 42,
          periodStart,
          periodEnd,
          dueDate,
          electricityStart: 10,
          electricityEnd: 12,
          electricityUnitPrice: 3500,
          waterStart: 1,
          waterEnd: 2,
          waterUnitPrice: 20000,
          internetAmount: 100000,
          parkingAmount: 50000,
          serviceAmount: 0,
          otherAmount: 10000,
        },
      ),
    ).resolves.toMatchObject({ id: 101, totalAmount: '2687000.00' });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(contracts.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(invoices.create).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: 42,
        rentAmount: '2500000.00',
        electricityUsage: '2.00',
        electricityAmount: '7000.00',
        totalAmount: '2687000.00',
        status: InvoiceStatus.UNPAID,
      }),
    );
    expect(invoiceItems.create).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: InvoiceItemType.RENT,
          amount: '2500000.00',
        }),
        expect.objectContaining({
          type: InvoiceItemType.ELECTRICITY,
          quantity: '2.00',
          amount: '7000.00',
        }),
      ]),
    );
    expect(notifications.create).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 7,
        type: NotificationType.INVOICE,
      }),
    ]);
  });

  it('rejects invalid meter order before any database write', async () => {
    contracts.findOne.mockResolvedValue(createContract());

    await expect(
      service.create(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        {
          contractId: 42,
          periodStart,
          periodEnd,
          dueDate,
          electricityStart: 12,
          electricityEnd: 10,
        },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(invoices.save).not.toHaveBeenCalled();
    expect(invoiceItems.save).not.toHaveBeenCalled();
  });

  it('updates only an unpaid invoice conditionally and notifies tenants after the write', async () => {
    const full = createInvoice({ status: InvoiceStatus.PAID, paidAt: updatedAt });
    invoices.findOne
      .mockResolvedValueOnce({ id: 101, contractId: 42 })
      .mockResolvedValueOnce(createInvoice())
      .mockResolvedValueOnce(full);
    invoices.update.mockResolvedValue({ affected: 1 });
    tenants.find.mockResolvedValue([createTenant()]);
    notifications.save.mockResolvedValue([]);

    await expect(
      service.updateStatus(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        101,
        { status: InvoiceStatus.PAID },
      ),
    ).resolves.toMatchObject({ id: 101, status: InvoiceStatus.PAID });

    expect(invoices.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 101, status: expect.anything() }),
      expect.objectContaining({ status: InvoiceStatus.PAID, paidAt: expect.any(Date) }),
    );
    expect(notifications.save).toHaveBeenCalledTimes(1);
  });

  it('does not notify when a competing status update has already won', async () => {
    invoices.findOne
      .mockResolvedValueOnce({ id: 101, contractId: 42 })
      .mockResolvedValueOnce(createInvoice());
    invoices.update.mockResolvedValue({ affected: 0 });

    await expect(
      service.updateStatus(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        101,
        { status: InvoiceStatus.PAID },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('does not disclose another tenant invoice by ID', async () => {
    invoices.findOne.mockResolvedValue(createInvoice());

    await expect(
      service.getForUser(
        { id: 8, fullName: 'Khách', role: UserRole.STUDENT },
        101,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
