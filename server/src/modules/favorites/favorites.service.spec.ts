import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Favorite, Room } from '../../database/entities';
import { RoomStatus, ReviewStatus, UserRole, VerificationStatus } from '../../database/enums/domain.enums';
import { FavoritesService } from './favorites.service';

function createRoom(): Room {
  return {
    id: 3,
    propertyId: 2,
    code: 'P201',
    name: 'Phòng P201',
    description: null,
    price: '3500000.00',
    deposit: '3500000.00',
    area: '25.00',
    capacity: 2,
    availableSlots: 1,
    type: 'PRIVATE_ROOM',
    status: RoomStatus.AVAILABLE,
    electricityPrice: '3500.00',
    waterPrice: '15000.00',
    internetFee: '100000.00',
    parkingFee: '100000.00',
    serviceFee: '0.00',
    locationScore: null,
    publishedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    property: {
      id: 2,
      landlordId: 9,
      slug: 'nha-tro-p201',
      name: 'Nhà trọ P',
      description: null,
      address: 'Hà Nội',
      ward: null,
      district: null,
      city: 'Hà Nội',
      latitude: '20.0',
      longitude: '105.0',
      rules: null,
      openingHours: null,
      contactPhone: null,
      verificationStatus: VerificationStatus.UNVERIFIED,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      landlord: {
        id: 9,
        username: 'landlord',
        email: 'private@example.com',
        passwordHash: 'private-password-hash',
        fullName: 'Chủ trọ',
        phone: null,
        avatarUrl: null,
        role: UserRole.LANDLORD,
        status: 'ACTIVE',
        verificationStatus: VerificationStatus.UNVERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    images: [],
    amenities: [],
    reviews: [
      { rating: 4, status: ReviewStatus.PUBLISHED },
      { rating: 1, status: ReviewStatus.HIDDEN },
    ],
  } as unknown as Room;
}

describe('FavoritesService', () => {
  const favorites = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const rooms = { findOneBy: jest.fn() };
  let service: FavoritesService;

  beforeEach(() => {
    jest.resetAllMocks();
    favorites.create.mockImplementation((input) => input);
    service = new FavoritesService(
      favorites as unknown as Repository<Favorite>,
      rooms as unknown as Repository<Room>,
    );
  });

  it('lists favorites for only the active student and maps rooms without password hashes', async () => {
    const room = createRoom();
    favorites.findAndCount.mockResolvedValue([
      [{ id: 4, studentId: 7, roomId: 3, createdAt: new Date(), room }],
      1,
    ]);

    const result = await service.list(7, { page: 1, limit: 12 });

    expect(favorites.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 7 } }),
    );
    expect(result.data.items[0].room.averageRating).toBe(4);
    expect(result.data.items[0].room.property.landlord).not.toHaveProperty(
      'passwordHash',
    );
  });

  it('does not favorite a hidden room', async () => {
    rooms.findOneBy.mockResolvedValue(
      Object.assign(createRoom(), { status: RoomStatus.HIDDEN }),
    );

    await expect(service.add(7, { roomId: 3 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(favorites.save).not.toHaveBeenCalled();
  });

  it('maps a unique-key race to the duplicate favorite response', async () => {
    rooms.findOneBy.mockResolvedValue(createRoom());
    favorites.findOneBy.mockResolvedValue(null);
    favorites.save.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });

    await expect(service.add(7, { roomId: 3 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('deletes with both student and room IDs', async () => {
    favorites.delete.mockResolvedValue({ affected: 1 });

    await service.remove(7, 3);

    expect(favorites.delete).toHaveBeenCalledWith({ studentId: 7, roomId: 3 });
  });
});
