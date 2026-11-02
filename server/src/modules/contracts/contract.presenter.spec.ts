import { Contract, ContractTenant } from '../../database/entities';
import {
  ContractStatus,
  InvoiceStatus,
  RoomStatus,
  RoomType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { presentContract } from './contract.presenter';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

function user(id: number, role: UserRole) {
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
  };
}

function tenant(
  id: number,
  studentId: number,
  isPrimaryTenant: boolean,
): ContractTenant {
  return {
    id,
    contractId: 42,
    studentId,
    isPrimaryTenant,
    moveInDate: null,
    moveOutDate: null,
    signedAt: null,
    createdAt,
    updatedAt,
    student: user(studentId, UserRole.STUDENT) as never,
  } as unknown as ContractTenant;
}

describe('presentContract', () => {
  it('projects safe relationship summaries and deterministic tenant/invoice order', () => {
    const contract = {
      id: 42,
      contractNumber: 'HD-2026-11-ABC12345',
      roomId: 11,
      landlordId: 9,
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      endDate: new Date('2027-02-28T00:00:00.000Z'),
      rent: '2500000',
      deposit: '2500000',
      terms: 'Điều khoản thuê phòng mẫu.',
      status: ContractStatus.DRAFT,
      signedAt: null,
      terminatedAt: null,
      createdAt,
      updatedAt,
      landlord: user(9, UserRole.LANDLORD),
      room: {
        id: 11,
        name: 'Phòng 101',
        code: 'P101',
        capacity: 2,
        availableSlots: 1,
        status: RoomStatus.AVAILABLE,
        type: RoomType.PRIVATE_ROOM,
        property: {
          id: 5,
          name: 'Nhà trọ Mẫu',
          address: 'Hà Nội',
          contactPhone: 'private-property-phone',
        },
      },
      tenants: [tenant(102, 8, false), tenant(101, 7, true)],
      invoices: [
        {
          id: 2,
          invoiceNumber: 'HD-2',
          totalAmount: '2600000',
          status: InvoiceStatus.UNPAID,
          dueDate: new Date('2026-05-10T00:00:00.000Z'),
          periodEnd: new Date('2026-05-01T00:00:00.000Z'),
        },
        {
          id: 1,
          invoiceNumber: 'HD-1',
          totalAmount: '2500000',
          status: InvoiceStatus.PAID,
          dueDate: new Date('2026-04-10T00:00:00.000Z'),
          periodEnd: new Date('2026-04-01T00:00:00.000Z'),
        },
      ],
    } as Contract;

    const result = presentContract(contract);

    expect(result.tenants.map((item) => item.studentId)).toEqual([7, 8]);
    expect(result.invoices.map((item) => item.id)).toEqual([2, 1]);
    expect(result.landlord).not.toHaveProperty('email');
    expect(result.landlord).not.toHaveProperty('passwordHash');
    expect(result.tenants[0].student).not.toHaveProperty('phone');
    expect(result.room?.property).not.toHaveProperty('contactPhone');
  });

  it('sorts invoice dates returned as MySQL DATE strings', () => {
    const contract = {
      id: 42,
      contractNumber: 'HD-2026-11-ABC12345',
      roomId: 11,
      landlordId: 9,
      startDate: '2026-03-01',
      endDate: '2027-02-28',
      rent: '2500000',
      deposit: '2500000',
      terms: 'Điều khoản thuê phòng mẫu.',
      status: ContractStatus.DRAFT,
      signedAt: null,
      terminatedAt: null,
      createdAt,
      updatedAt,
      landlord: null,
      room: null,
      tenants: [],
      invoices: [
        {
          id: 1,
          invoiceNumber: 'HD-1',
          totalAmount: '2500000',
          status: InvoiceStatus.PAID,
          dueDate: '2026-04-10',
          periodEnd: '2026-04-01',
        },
        {
          id: 2,
          invoiceNumber: 'HD-2',
          totalAmount: '2600000',
          status: InvoiceStatus.UNPAID,
          dueDate: '2026-05-10',
          periodEnd: '2026-05-01',
        },
      ],
    } as unknown as Contract;

    expect(presentContract(contract).invoices.map((invoice) => invoice.id)).toEqual([2, 1]);
  });
});
