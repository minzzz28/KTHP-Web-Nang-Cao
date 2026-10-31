import { ConflictException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  NearbyPlace,
  Property,
  Room,
} from '../../database/entities';
import {
  NearbyPlaceCategory,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateNearbyPlaceDto } from './dto/create-nearby-place.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

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
    rooms: [],
    nearbyPlaces: [],
  } as unknown as Property;
}

function createInput(overrides: Partial<CreatePropertyDto> = {}): CreatePropertyDto {
  return {
    name: 'Nhà trọ mới',
    address: 'Số 12, Hà Đông, Hà Nội',
    city: 'Hà Nội',
    latitude: 20.96,
    longitude: 105.74,
    ...overrides,
  } as CreatePropertyDto;
}

describe('PropertiesService write operations', () => {
  const nearbyPlaces = {
    create: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const properties = {
    create: jest.fn(),
    delete: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const rooms = { countBy: jest.fn() };
  let transaction: jest.Mock;
  let service: PropertiesService;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    properties.create.mockImplementation((value: unknown) => value);
    nearbyPlaces.create.mockImplementation((value: unknown) => value);
    const repositories = new Map<unknown, unknown>([
      [NearbyPlace, nearbyPlaces],
      [Property, properties],
      [Room, rooms],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new PropertiesService(
      properties as unknown as Repository<Property>,
      { transaction } as unknown as DataSource,
    );
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('creates a property under the authenticated landlord and starts verification', async () => {
    properties.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeProperty());
    properties.save.mockResolvedValue({ id: 5 });

    await expect(service.create(landlord, createInput())).resolves.toMatchObject({
      id: 5,
      name: 'Nhà trọ Mẫu',
    });

    expect(properties.create).toHaveBeenCalledWith(
      expect.objectContaining({
        landlordId: landlord.id,
        slug: 'nha-tro-moi',
        verificationStatus: VerificationStatus.PENDING,
      }),
    );
  });

  it('does not let a landlord update another owner’s property', async () => {
    properties.findOne.mockResolvedValue(makeProperty(12));

    await expect(
      service.update(landlord, 5, { name: 'Tên mới' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(properties.update).not.toHaveBeenCalled();
  });

  it('accepts a slug-only update and keeps verification server-controlled', async () => {
    const locked = makeProperty();
    const refreshed = Object.assign(makeProperty(), { slug: 'nha-tro-moi' });
    properties.findOne
      .mockResolvedValueOnce(locked)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(refreshed);
    properties.update.mockResolvedValue({ affected: 1 });

    await expect(
      service.update(landlord, 5, { slug: 'nha-tro-moi' }),
    ).resolves.toMatchObject({ slug: 'nha-tro-moi' });

    expect(properties.update).toHaveBeenCalledWith(
      { id: 5 },
      { slug: 'nha-tro-moi' },
    );
  });

  it('refuses to delete a property that still has rooms', async () => {
    properties.findOne.mockResolvedValue(makeProperty());
    rooms.countBy.mockResolvedValue(1);

    await expect(service.remove(landlord, 5)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(properties.delete).not.toHaveBeenCalled();
  });

  it('binds a nearby place to the path property instead of request input', async () => {
    properties.findOne.mockResolvedValue(makeProperty());
    nearbyPlaces.save.mockResolvedValue({
      id: 21,
      propertyId: 5,
      name: 'Chợ',
      category: NearbyPlaceCategory.MARKET,
      address: null,
      latitude: '20.9600000',
      longitude: '105.7400000',
      distanceMeters: 300,
      createdAt,
      updatedAt,
    });

    await expect(
      service.createNearbyPlace(landlord, 5, {
        name: 'Chợ',
        category: NearbyPlaceCategory.MARKET,
        latitude: 20.96,
        longitude: 105.74,
        distanceMeters: 300,
      } as CreateNearbyPlaceDto),
    ).resolves.toMatchObject({ id: 21, propertyId: 5 });

    expect(nearbyPlaces.create).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 5 }),
    );
  });

  it('uses only fixed map hosts and caches safe geocoding results', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(
        JSON.stringify([
          {
            display_name: 'Nhân Chính, Thanh Xuân, Hà Nội',
            lat: '21.0012',
            lon: '105.8091',
            address: {
              quarter: 'Nhân Chính',
              city_district: 'Thanh Xuân',
              city: 'Hà Nội',
              ignored: 'Không trả về client',
            },
          },
        ]),
      ),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const input = { address: 'Nhân Chính, Thanh Xuân, Hà Nội' };
    await expect(service.geocode(landlord, input)).resolves.toEqual([
      {
        displayName: 'Nhân Chính, Thanh Xuân, Hà Nội',
        latitude: 21.0012,
        longitude: 105.8091,
        ward: 'Nhân Chính',
        district: 'Thanh Xuân',
        city: 'Hà Nội',
      },
    ]);
    await service.geocode(landlord, input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target] = fetchMock.mock.calls[0] as [URL];
    expect(`${target.origin}${target.pathname}`).toBe(
      'https://nominatim.openstreetmap.org/search',
    );
    expect(target.searchParams.get('q')).toBe(input.address);
  });
});
