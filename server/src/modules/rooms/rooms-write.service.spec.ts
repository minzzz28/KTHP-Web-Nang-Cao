import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  Amenity,
  Contract,
  ContractTenant,
  Favorite,
  NearbyPlace,
  Notification,
  Property,
  Room,
  RoomAmenity,
  RoomImage,
  RoomPriceHistory,
  University,
} from '../../database/entities';
import {
  RoomStatus,
  RoomType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomsService } from './rooms.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

const landlord: AuthenticatedUser = {
  id: 9,
  username: 'landlord-9',
  email: 'private@example.test',
  fullName: 'Chủ trọ',
  role: UserRole.LANDLORD,
  status: UserStatus.ACTIVE,
};

function makeProperty(landlordId = landlord.id): Property {
  return {
    id: 5,
    landlordId,
    slug: 'nha-tro-mau',
    name: 'Nhà trọ Mẫu',
    description: null,
    address: 'Hà Nội',
    ward: null,
    district: 'Hà Đông',
    city: 'Hà Nội',
    latitude: '20.9600000',
    longitude: '105.7400000',
    rules: null,
    openingHours: null,
    contactPhone: null,
    verificationStatus: VerificationStatus.VERIFIED,
    createdAt,
    updatedAt,
    landlord: {
      id: landlordId,
      username: 'owner',
      email: 'owner@example.test',
      passwordHash: 'not-for-output',
      fullName: 'Chủ trọ',
      phone: null,
      avatarUrl: null,
      role: UserRole.LANDLORD,
      status: UserStatus.ACTIVE,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt,
      updatedAt,
    },
  } as Property;
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 11,
    propertyId: 5,
    code: 'P101',
    name: 'Phòng 101',
    description: null,
    price: '2500000.00',
    deposit: '2500000.00',
    area: '20.00',
    capacity: 2,
    availableSlots: 2,
    type: RoomType.PRIVATE_ROOM,
    status: RoomStatus.AVAILABLE,
    electricityPrice: '3500.00',
    waterPrice: '20000.00',
    internetFee: '100000.00',
    parkingFee: '50000.00',
    serviceFee: '0.00',
    locationScore: null,
    publishedAt: createdAt,
    createdAt,
    updatedAt,
    property: makeProperty(),
    images: [],
    amenities: [],
    reviews: [],
    ...overrides,
  } as Room;
}

function createInput(overrides: Partial<CreateRoomDto> = {}): CreateRoomDto {
  return {
    propertyId: 5,
    code: 'P101',
    name: 'Phòng 101',
    price: 2500000,
    deposit: 2500000,
    area: 20,
    capacity: 2,
    availableSlots: 2,
    type: RoomType.PRIVATE_ROOM,
    status: RoomStatus.AVAILABLE,
    electricityPrice: 3500,
    waterPrice: 20000,
    internetFee: 100000,
    parkingFee: 50000,
    ...overrides,
  } as CreateRoomDto;
}

describe('RoomsService write operations', () => {
  const amenities = { countBy: jest.fn() };
  const contracts = { find: jest.fn() };
  const contractTenants = { countBy: jest.fn() };
  const favorites = { find: jest.fn() };
  const notifications = { create: jest.fn(), save: jest.fn() };
  const priceHistories = { create: jest.fn(), find: jest.fn(), save: jest.fn() };
  const properties = { findOne: jest.fn() };
  const roomAmenities = { create: jest.fn(), delete: jest.fn(), save: jest.fn() };
  const roomImages = { create: jest.fn(), delete: jest.fn(), save: jest.fn() };
  const rooms = {
    create: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const universities = { findOneBy: jest.fn() };
  const nearbyPlaces = { find: jest.fn() };
  let transaction: jest.Mock;
  let service: RoomsService;

  beforeEach(() => {
    jest.resetAllMocks();
    rooms.create.mockImplementation((value: unknown) => value);
    roomAmenities.create.mockImplementation((value: unknown) => value);
    roomImages.create.mockImplementation((value: unknown) => value);
    priceHistories.create.mockImplementation((value: unknown) => value);
    notifications.create.mockImplementation((value: unknown) => value);

    const repositories = new Map<unknown, unknown>([
      [Amenity, amenities],
      [Contract, contracts],
      [ContractTenant, contractTenants],
      [Favorite, favorites],
      [Notification, notifications],
      [Property, properties],
      [Room, rooms],
      [RoomAmenity, roomAmenities],
      [RoomImage, roomImages],
      [RoomPriceHistory, priceHistories],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new RoomsService(
      rooms as unknown as Repository<Room>,
      universities as unknown as Repository<University>,
      priceHistories as unknown as Repository<RoomPriceHistory>,
      nearbyPlaces as unknown as Repository<NearbyPlace>,
      { transaction } as unknown as DataSource,
    );
  });

  it('rejects a landlord creating a room under someone else’s property', async () => {
    properties.findOne.mockResolvedValue(makeProperty(12));

    await expect(service.create(landlord, createInput())).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(rooms.create).not.toHaveBeenCalled();
    expect(rooms.save).not.toHaveBeenCalled();
    expect(priceHistories.save).not.toHaveBeenCalled();
  });

  it('creates the initial price history explicitly with the new room', async () => {
    properties.findOne.mockResolvedValue(makeProperty());
    rooms.save.mockResolvedValue({ id: 11 });
    rooms.findOne.mockResolvedValue(makeRoom());
    priceHistories.save.mockResolvedValue({ id: 90 });

    await expect(service.create(landlord, createInput())).resolves.toMatchObject({
      id: 11,
      code: 'P101',
    });

    expect(properties.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
    expect(priceHistories.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 11,
        oldPrice: null,
        newPrice: '2500000',
        changedById: landlord.id,
        reason: 'Giá đăng ban đầu',
      }),
    );
    expect(priceHistories.save).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ capacity: 1 }, 'keeps an old available-slot value larger than capacity'],
    [{ availableSlots: 3 }, 'sets slots above the current capacity'],
    [{ capacity: 1, availableSlots: 2 }, 'sends incompatible values together'],
  ])('rejects an update that %s', async (input, _description) => {
    rooms.findOne.mockResolvedValue(makeRoom());
    contracts.find.mockResolvedValue([]);

    await expect(
      service.update(landlord, 11, input as UpdateRoomDto),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(rooms.update).not.toHaveBeenCalled();
    expect(priceHistories.save).not.toHaveBeenCalled();
  });

  it('records a price change once and notifies current favorites', async () => {
    const locked = makeRoom();
    const refreshed = makeRoom({ price: '2600000' });
    rooms.findOne
      .mockResolvedValueOnce(locked)
      .mockResolvedValueOnce(refreshed);
    rooms.update.mockResolvedValue({ affected: 1 });
    priceHistories.save.mockResolvedValue({ id: 91 });
    favorites.find.mockResolvedValue([{ studentId: 7 }]);
    notifications.save.mockResolvedValue([]);

    await expect(
      service.update(landlord, 11, { price: 2600000 }),
    ).resolves.toMatchObject({ id: 11, price: '2600000' });

    expect(priceHistories.create).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 11,
        oldPrice: '2500000.00',
        newPrice: '2600000',
        changedById: landlord.id,
        reason: 'Chủ trọ cập nhật giá',
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 7, type: 'PRICE_CHANGED' }),
    ]);
  });

  it('does not add price history for a numerically unchanged decimal value', async () => {
    const locked = makeRoom();
    rooms.findOne
      .mockResolvedValueOnce(locked)
      .mockResolvedValueOnce(locked);
    rooms.update.mockResolvedValue({ affected: 1 });

    await service.update(landlord, 11, { price: 2500000 });

    expect(priceHistories.save).not.toHaveBeenCalled();
    expect(favorites.find).not.toHaveBeenCalled();
  });

  it('soft-hides only a room owned by the landlord', async () => {
    rooms.findOne.mockResolvedValue(makeRoom({ property: makeProperty(12) }));

    await expect(service.hide(landlord, 11)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(rooms.update).not.toHaveBeenCalled();

    rooms.findOne.mockResolvedValue(makeRoom());
    rooms.update.mockResolvedValue({ affected: 1 });
    await expect(service.hide(landlord, 11)).resolves.toEqual({
      id: 11,
      status: RoomStatus.HIDDEN,
    });
    expect(rooms.update).toHaveBeenLastCalledWith(
      { id: 11 },
      { status: RoomStatus.HIDDEN },
    );
  });
});
