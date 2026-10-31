import { DataSource, Repository } from 'typeorm';
import {
  NearbyPlace,
  Room,
  RoomPriceHistory,
  University,
} from '../../database/entities';
import { RoomStatus, RoomType, UserRole, VerificationStatus } from '../../database/enums/domain.enums';
import { RoomsService } from './rooms.service';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 1,
    propertyId: 1,
    code: 'P101',
    name: 'Phòng gần trường',
    description: 'Phòng dành cho sinh viên',
    price: '2800000.00',
    deposit: '2800000.00',
    area: '24.00',
    capacity: 2,
    availableSlots: 1,
    type: RoomType.PRIVATE_ROOM,
    status: RoomStatus.AVAILABLE,
    electricityPrice: '3500.00',
    waterPrice: '20000.00',
    internetFee: '100000.00',
    parkingFee: '100000.00',
    serviceFee: '50000.00',
    locationScore: '9.4',
    publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    property: {
      id: 1,
      landlordId: 10,
      slug: 'tro-phenikaa',
      name: 'Nhà trọ Phenikaa',
      description: null,
      address: 'Dương Nội, Hà Đông',
      ward: null,
      district: 'Hà Đông',
      city: 'Hà Nội',
      latitude: '20.9612416',
      longitude: '105.7474728',
      rules: null,
      openingHours: null,
      contactPhone: null,
      verificationStatus: VerificationStatus.VERIFIED,
      createdAt: new Date(),
      updatedAt: new Date(),
      landlord: {
        id: 10,
        username: 'landlord',
        email: 'landlord@example.test',
        passwordHash: 'not-for-output',
        fullName: 'Chủ trọ',
        phone: null,
        avatarUrl: null,
        role: UserRole.LANDLORD,
        status: 'ACTIVE',
        verificationStatus: VerificationStatus.VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    images: [],
    amenities: [],
    reviews: [],
    ...overrides,
  } as Room;
}

describe('RoomsService', () => {
  const roomsRepository = { find: jest.fn(), findOne: jest.fn() };
  const universitiesRepository = { findOneBy: jest.fn() };
  const priceHistoriesRepository = { find: jest.fn() };
  const nearbyPlacesRepository = { find: jest.fn() };
  const dataSource = { transaction: jest.fn() };
  let service: RoomsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new RoomsService(
      roomsRepository as unknown as Repository<Room>,
      universitiesRepository as unknown as Repository<University>,
      priceHistoriesRepository as unknown as Repository<RoomPriceHistory>,
      nearbyPlacesRepository as unknown as Repository<NearbyPlace>,
      dataSource as unknown as DataSource,
    );
  });

  it('returns legacy room data for the selected university without exposing unavailable rooms', async () => {
    const inRange = makeRoom();
    const farAway = makeRoom({ id: 2, code: 'P102', property: { ...inRange.property, id: 2, latitude: '21.1000000' } });
    const hidden = makeRoom({ id: 3, code: 'P103', status: RoomStatus.HIDDEN });
    roomsRepository.find.mockResolvedValue([inRange, farAway, hidden]);
    universitiesRepository.findOneBy.mockResolvedValue({
      id: 5,
      latitude: '20.9612416',
      longitude: '105.7474728',
    });

    await expect(
      service.list({
        universityId: 5,
        radiusKm: 3,
        page: 1,
        limit: 3,
        sort: 'NEWEST',
      }),
    ).resolves.toMatchObject({
      data: { items: [expect.objectContaining({ id: 1, distanceKm: 0 })] },
      meta: { page: 1, limit: 3, total: 1, totalPages: 1 },
    });
  });

  it('treats a search term as data rather than executable SQL', async () => {
    roomsRepository.find.mockResolvedValue([makeRoom()]);

    await expect(
      service.list({ q: "P101' OR 1=1 --", page: 1, limit: 12, sort: 'NEWEST' }),
    ).resolves.toMatchObject({ meta: { total: 0 } });
  });

  it('returns only public room price history without changing database data', async () => {
    roomsRepository.findOne.mockResolvedValue(
      makeRoom({ propertyId: 7 }),
    );
    priceHistoriesRepository.find.mockResolvedValue([
      {
        id: 9,
        roomId: 1,
        oldPrice: '2500000.00',
        newPrice: '2800000.00',
        reason: 'Chủ trọ cập nhật giá',
        changedAt: new Date('2026-09-02T00:00:00.000Z'),
      },
    ]);

    await expect(service.priceHistory(1)).resolves.toEqual([
      expect.objectContaining({ id: 9, newPrice: '2800000.00' }),
    ]);
    expect(priceHistoriesRepository.find).toHaveBeenCalledWith({
      where: { roomId: 1 },
      order: { changedAt: 'ASC' },
    });
  });

  it('does not expose nearby places for a hidden room', async () => {
    roomsRepository.findOne.mockResolvedValue(
      makeRoom({ status: RoomStatus.HIDDEN }),
    );

    await expect(service.nearbyPlaces(1)).rejects.toThrow(
      'Không tìm thấy phòng',
    );
    expect(nearbyPlacesRepository.find).not.toHaveBeenCalled();
  });
});
