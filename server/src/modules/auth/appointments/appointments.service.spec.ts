import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  Notification,
  Room,
  ViewingAppointment,
} from '../../database/entities';
import {
  NotificationType,
  RoomStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
  ViewingAppointmentStatus,
} from '../../database/enums/domain.enums';
import { AppointmentActionDto } from './dto/appointment-action.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentsService } from './appointments.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');
const future = new Date('2099-01-02T10:00:00.000Z');

function createUser(id: number, role = UserRole.STUDENT) {
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
    availableSlots: 1,
    type: 'PRIVATE_ROOM',
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

function createAppointment(
  overrides: Partial<ViewingAppointment> = {},
): ViewingAppointment {
  return {
    id: 42,
    roomId: 11,
    studentId: 7,
    landlordId: 9,
    scheduledAt: future,
    proposedAt: null,
    status: ViewingAppointmentStatus.PENDING,
    studentNote: 'Xin xem phòng',
    landlordNote: null,
    respondedAt: null,
    cancelledAt: null,
    createdAt,
    updatedAt,
    room: createRoom(),
    student: createUser(7) as never,
    landlord: createUser(9, UserRole.LANDLORD) as never,
    ...overrides,
  } as ViewingAppointment;
}

describe('AppointmentsService', () => {
  const appointments = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const rooms = { findOne: jest.fn() };
  const notifications = { create: jest.fn(), save: jest.fn() };
  let transaction: jest.Mock;
  let service: AppointmentsService;

  beforeEach(() => {
    jest.resetAllMocks();
    appointments.create.mockImplementation((input: unknown) => input);
    notifications.create.mockImplementation((input: unknown) => input);

    const repositories = new Map<unknown, unknown>([
      [ViewingAppointment, appointments],
      [Room, rooms],
      [Notification, notifications],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new AppointmentsService(
      appointments as unknown as Repository<ViewingAppointment>,
      { transaction } as unknown as DataSource,
    );
  });

  it('scopes a student list and returns no private user data', async () => {
    appointments.findAndCount.mockResolvedValue([[createAppointment()], 1]);

    const result = await service.list(
      { id: 7, fullName: 'Sinh viên', role: UserRole.STUDENT },
      { page: 1, limit: 50 },
    );

    expect(appointments.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 7 }, take: 50 }),
    );
    expect(result.data.items[0].note).toBe('Xin xem phòng');
    expect(result.data.items[0].student).not.toHaveProperty('email');
    expect(result.data.items[0].landlord).not.toHaveProperty('passwordHash');
  });

  it('creates one future booking and landlord notification in one transaction', async () => {
    const appointment = createAppointment();
    rooms.findOne.mockResolvedValue(createRoom());
    appointments.findOneBy.mockResolvedValue(null);
    appointments.save.mockResolvedValue(appointment);
    notifications.save.mockResolvedValue({});
    appointments.findOne.mockResolvedValue(appointment);

    const result = await service.create(
      { id: 7, fullName: 'Sinh viên', role: UserRole.STUDENT },
      { roomId: 11, scheduledAt: future, studentNote: '  Xin xem phòng  ' },
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(rooms.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 11 },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    expect(appointments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 11,
        studentId: 7,
        landlordId: 9,
        status: ViewingAppointmentStatus.PENDING,
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 9,
        type: NotificationType.APPOINTMENT,
      }),
    );
    expect(result.room?.name).toBe('Phòng 101');
  });

  it('rejects an active duplicate before creating a second appointment', async () => {
    rooms.findOne.mockResolvedValue(createRoom());
    appointments.findOneBy.mockResolvedValue(createAppointment());

    await expect(
      service.create(
        { id: 7, fullName: 'Sinh viên', role: UserRole.STUDENT },
        { roomId: 11, scheduledAt: future },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(appointments.save).not.toHaveBeenCalled();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('updates only a managing landlord and notifies the student after the conditional write', async () => {
    const locked = createAppointment();
    const full = createAppointment({
      status: ViewingAppointmentStatus.ACCEPTED,
      respondedAt: updatedAt,
    });
    appointments.findOne
      .mockResolvedValueOnce(locked)
      .mockResolvedValueOnce(full);
    appointments.update.mockResolvedValue({ affected: 1 });
    notifications.save.mockResolvedValue({});

    await expect(
      service.respond(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        42,
        { status: ViewingAppointmentStatus.ACCEPTED },
      ),
    ).resolves.toMatchObject({ id: 42, status: ViewingAppointmentStatus.ACCEPTED });

    expect(appointments.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        landlordId: 9,
        status: expect.anything(),
      }),
      expect.objectContaining({
        status: ViewingAppointmentStatus.ACCEPTED,
        proposedAt: null,
      }),
    );
    expect(notifications.save).toHaveBeenCalledTimes(1);
  });

  it('does not send a response notification when a competing update wins', async () => {
    appointments.findOne.mockResolvedValue(createAppointment());
    appointments.update.mockResolvedValue({ affected: 0 });

    await expect(
      service.respond(
        { id: 9, fullName: 'Chủ trọ', role: UserRole.LANDLORD },
        42,
        { status: ViewingAppointmentStatus.REJECTED },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('does not disclose another student\'s appointment by ID', async () => {
    appointments.findOne.mockResolvedValue(createAppointment());

    await expect(
      service.getForUser(
        { id: 8, fullName: 'Khách', role: UserRole.STUDENT },
        42,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validates both the reschedule requirement and the legacy cancellation DTO', async () => {
    const missingProposal = plainToInstance(AppointmentActionDto, {
      status: ViewingAppointmentStatus.RESCHEDULED,
    });
    const cancellation = plainToInstance(UpdateAppointmentDto, {
      status: ViewingAppointmentStatus.CANCELLED,
    });

    expect(await validate(missingProposal)).not.toHaveLength(0);
    expect(await validate(cancellation)).toHaveLength(0);
  });
});
