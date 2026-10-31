import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { NearbyPlace, Property, Room } from '../../database/entities';
import {
  UserRole,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateNearbyPlaceDto } from './dto/create-nearby-place.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GeocodeAddressDto } from './dto/geocode-address.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

export interface PropertyListResult {
  data: { items: ReturnType<typeof presentProperty>[] };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type PropertyRepositories = {
  nearbyPlaces: Repository<NearbyPlace>;
  properties: Repository<Property>;
  rooms: Repository<Room>;
};

type GeocodeItem = {
  displayName: string;
  latitude: number;
  longitude: number;
  ward: string | null;
  district: string | null;
  city: string | null;
};

type GeocodeCacheEntry = { expiresAt: number; items: GeocodeItem[] };

const GEOCODE_CACHE_TTL_MS = 15 * 60 * 1000;
const GEOCODE_CACHE_MAX_ENTRIES = 100;
const GEOCODE_LIMIT_PER_MINUTE = 8;
const GEOCODE_RESPONSE_MAX_BYTES = 1_000_000;
const NOMINATIM_MIN_INTERVAL_MS = 1_100;

@Injectable()
export class PropertiesService {
  private readonly geocodeCache = new Map<string, GeocodeCacheEntry>();
  private readonly geocodeUsage = new Map<
    number,
    { windowStartedAt: number; count: number }
  >();
  private lastNominatimRequestAt = 0;

  constructor(
    @InjectRepository(Property)
    private readonly properties: Repository<Property>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    user: AuthenticatedUser,
    query: ListPropertiesQueryDto,
  ): Promise<PropertyListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: FindOptionsWhere<Property> = {};

    if (user.role === UserRole.LANDLORD) {
      where.landlordId = user.id;
    } else if (query.landlordId !== undefined) {
      where.landlordId = query.landlordId;
    }
    if (query.city) where.city = query.city;
    if (query.district) where.district = query.district;

    const [items, total] = await this.properties.findAndCount({
      where,
      relations: { landlord: true, rooms: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: { items: items.map((property) => presentProperty(property)) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findById(id: number) {
    const property = await this.properties.findOne({
      where: { id },
      relations: { landlord: true, rooms: true, nearbyPlaces: true },
    });

    if (!property) throw new NotFoundException('Không tìm thấy khu trọ');
    return presentProperty(property, { includeDetail: true });
  }

  async nearbyPlaces(id: number) {
    const property = await this.properties.findOne({
      where: { id },
      relations: { nearbyPlaces: true },
    });

    if (!property) throw new NotFoundException('Không tìm thấy khu trọ');

    return (property.nearbyPlaces ?? [])
      .sort(
        (left, right) =>
          (left.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
            (right.distanceMeters ?? Number.MAX_SAFE_INTEGER) ||
          left.name.localeCompare(right.name, 'vi'),
      )
      .map((place) => ({
        id: place.id,
        propertyId: place.propertyId,
        name: place.name,
        category: place.category,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        distanceMeters: place.distanceMeters,
      }));
  }

  /**
   * Looks up an address using fixed public OpenStreetMap hosts.  The client
   * cannot turn this endpoint into a network proxy because it only supplies
   * the `q` search parameter, never a URL or host.
   */
  async geocode(actor: AuthenticatedUser, input: GeocodeAddressDto) {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền tìm vị trí');
    }
    this.consumeGeocodeQuota(actor.id);

    const key = `${actor.id}:${input.address.toLocaleLowerCase('vi-VN')}`;
    const cached = this.getCachedGeocode(key);
    if (cached) return cached;

    const now = Date.now();
    if (now - this.lastNominatimRequestAt < NOMINATIM_MIN_INTERVAL_MS) {
      throw new HttpException(
        'Vui lòng chờ khoảng một giây rồi tìm lại vị trí.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.lastNominatimRequestAt = now;

    const nominatimUrl = new URL(
      'https://nominatim.openstreetmap.org/search',
    );
    nominatimUrl.search = new URLSearchParams({
      q: input.address,
      format: 'jsonv2',
      addressdetails: '1',
      countrycodes: 'vn',
      limit: '5',
      'accept-language': 'vi',
    }).toString();
    const primary = await this.fetchGeocodeJson(nominatimUrl);
    let items = primary.available
      ? normalizeNominatimResults(primary.payload)
      : [];

    if (items.length === 0) {
      const photonUrl = new URL('https://photon.komoot.io/api/');
      photonUrl.search = new URLSearchParams({
        q: input.address,
        limit: '5',
        // Bounds of Vietnam prevent broad input returning another country.
        bbox: '102.14,8.18,109.47,23.40',
      }).toString();
      const fallback = await this.fetchGeocodeJson(photonUrl);
      items = fallback.available ? normalizePhotonResults(fallback.payload) : [];
      if (items.length === 0 && !primary.available && !fallback.available) {
        throw new ServiceUnavailableException(
          'Không thể kết nối dịch vụ bản đồ. Vui lòng thử lại sau.',
        );
      }
    }

    if (items.length === 0) {
      throw new NotFoundException(
        'Không tìm thấy vị trí. Hãy nhập địa chỉ cụ thể hơn.',
      );
    }
    this.cacheGeocode(key, items);
    return items;
  }

  async create(actor: AuthenticatedUser, input: CreatePropertyDto) {
    if (actor.role !== UserRole.LANDLORD) {
      throw new ForbiddenException('Chỉ chủ trọ có thể tạo khu trọ');
    }

    try {
      const propertyId = await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        const slug = await this.uniqueSlug(
          repositories.properties,
          input.slug ?? input.name,
        );
        const property = await repositories.properties.save(
          repositories.properties.create({
            landlordId: actor.id,
            slug,
            name: input.name,
            description: input.description ?? null,
            address: input.address,
            ward: input.ward ?? null,
            district: input.district ?? null,
            city: input.city ?? 'Hà Nội',
            latitude: String(input.latitude),
            longitude: String(input.longitude),
            rules: input.rules ?? null,
            openingHours: input.openingHours ?? null,
            contactPhone: input.contactPhone ?? null,
            // New properties require the existing admin verification flow.
            verificationStatus: VerificationStatus.PENDING,
          }),
        );
        return property.id;
      });

      return presentProperty(await this.loadFullProperty(propertyId), {
        includeDetail: true,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Đường dẫn khu trọ đã tồn tại');
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    propertyId: number,
    input: UpdatePropertyDto,
  ) {
    const values = this.toUpdateValues(input);
    if (Object.keys(values).length === 0 && input.slug === undefined) {
      throw new UnprocessableEntityException('Cần có dữ liệu cập nhật');
    }

    try {
      const updatedId = await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        const property = await this.requireLockedProperty(
          repositories.properties,
          propertyId,
        );
        this.requirePropertyOwner(actor, property);

        if (input.slug !== undefined) {
          values.slug = await this.uniqueSlug(
            repositories.properties,
            input.slug,
            property.id,
          );
        }
        const result = await repositories.properties.update(
          { id: property.id },
          values,
        );
        if (!result.affected) {
          throw new ConflictException('Khu trọ đã thay đổi, vui lòng tải lại');
        }
        return property.id;
      });

      return presentProperty(await this.loadFullProperty(updatedId), {
        includeDetail: true,
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Đường dẫn khu trọ đã tồn tại');
      }
      throw error;
    }
  }

  async remove(actor: AuthenticatedUser, propertyId: number): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        // Room creation locks this same property first, so this room count is
        // stable for concurrent requests through the Nest API.
        const property = await this.requireLockedProperty(
          repositories.properties,
          propertyId,
        );
        this.requirePropertyOwner(actor, property);

        const roomCount = await repositories.rooms.countBy({
          propertyId: property.id,
        });
        if (roomCount > 0) {
          throw new ConflictException(
            'Không thể xóa khu trọ còn phòng. Hãy ẩn hoặc xóa phòng trước.',
          );
        }
        const result = await repositories.properties.delete({ id: property.id });
        if (!result.affected) {
          throw new ConflictException('Khu trọ đã thay đổi, vui lòng tải lại');
        }
      });
    } catch (error) {
      if (this.isForeignKeyConstraintError(error)) {
        throw new ConflictException(
          'Không thể xóa khu trọ còn dữ liệu liên quan',
        );
      }
      throw error;
    }
  }

  async createNearbyPlace(
    actor: AuthenticatedUser,
    propertyId: number,
    input: CreateNearbyPlaceDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const property = await this.requireLockedProperty(
        repositories.properties,
        propertyId,
      );
      this.requirePropertyOwner(actor, property);

      const place = await repositories.nearbyPlaces.save(
        repositories.nearbyPlaces.create({
          propertyId: property.id,
          name: input.name,
          category: input.category,
          address: input.address ?? null,
          latitude: String(input.latitude),
          longitude: String(input.longitude),
          distanceMeters: input.distanceMeters ?? null,
        }),
      );
      return presentNearbyPlace(place);
    });
  }

  async removeNearbyPlace(
    actor: AuthenticatedUser,
    propertyId: number,
    placeId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const property = await this.requireLockedProperty(
        repositories.properties,
        propertyId,
      );
      this.requirePropertyOwner(actor, property);
      const place = await repositories.nearbyPlaces.findOne({
        where: { id: placeId, propertyId: property.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!place) {
        throw new NotFoundException('Không tìm thấy tiện ích xung quanh');
      }

      const result = await repositories.nearbyPlaces.delete({ id: place.id });
      if (!result.affected) {
        throw new ConflictException('Tiện ích xung quanh đã thay đổi');
      }
    });
  }

  private getRepositories(manager: EntityManager): PropertyRepositories {
    return {
      nearbyPlaces: manager.getRepository(NearbyPlace),
      properties: manager.getRepository(Property),
      rooms: manager.getRepository(Room),
    };
  }

  private consumeGeocodeQuota(userId: number): void {
    const now = Date.now();
    const usage = this.geocodeUsage.get(userId);
    if (!usage || now - usage.windowStartedAt >= 60_000) {
      this.geocodeUsage.set(userId, { windowStartedAt: now, count: 1 });
      return;
    }
    if (usage.count >= GEOCODE_LIMIT_PER_MINUTE) {
      throw new HttpException(
        'Bạn đã tìm vị trí quá nhiều lần. Vui lòng chờ một lát rồi thử lại.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    usage.count += 1;
  }

  private getCachedGeocode(key: string): GeocodeItem[] | null {
    const entry = this.geocodeCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.geocodeCache.delete(key);
      return null;
    }
    return entry.items;
  }

  private cacheGeocode(key: string, items: GeocodeItem[]): void {
    if (this.geocodeCache.size >= GEOCODE_CACHE_MAX_ENTRIES) {
      const oldestKey = this.geocodeCache.keys().next().value;
      if (oldestKey) this.geocodeCache.delete(oldestKey);
    }
    this.geocodeCache.set(key, {
      expiresAt: Date.now() + GEOCODE_CACHE_TTL_MS,
      items,
    });
  }

  private async fetchGeocodeJson(url: URL): Promise<{
    available: boolean;
    payload: unknown;
  }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          // Identifies this fixed service request; it is never client input.
          'User-Agent': 'StudentRentalManager/1.0 (local-development)',
        },
        signal: controller.signal,
      });
      if (!response.ok) return { available: false, payload: null };

      const text = await response.text();
      if (Buffer.byteLength(text, 'utf8') > GEOCODE_RESPONSE_MAX_BYTES) {
        return { available: false, payload: null };
      }
      try {
        return { available: true, payload: JSON.parse(text) };
      } catch {
        return { available: false, payload: null };
      }
    } catch {
      return { available: false, payload: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requireLockedProperty(
    repository: Repository<Property>,
    propertyId: number,
  ): Promise<Property> {
    const property = await repository.findOne({
      where: { id: propertyId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!property) {
      throw new NotFoundException('Không tìm thấy khu trọ');
    }
    return property;
  }

  private requirePropertyOwner(
    actor: AuthenticatedUser,
    property: Property,
  ): void {
    if (
      actor.role !== UserRole.ADMIN &&
      (actor.role !== UserRole.LANDLORD || property.landlordId !== actor.id)
    ) {
      throw new ForbiddenException('Bạn không có quyền thao tác khu trọ này');
    }
  }

  private async loadFullProperty(propertyId: number): Promise<Property> {
    const property = await this.properties.findOne({
      where: { id: propertyId },
      relations: { landlord: true, rooms: true, nearbyPlaces: true },
    });
    if (!property) throw new NotFoundException('Không tìm thấy khu trọ');
    return property;
  }

  private async uniqueSlug(
    repository: Repository<Property>,
    rawValue: string,
    excludedId?: number,
  ): Promise<string> {
    const base = slugify(rawValue) || 'khu-tro';
    for (let suffix = 0; suffix < 1000; suffix += 1) {
      const slug = suffix === 0 ? base : `${base}-${suffix}`;
      const found = await repository.findOne({
        where: { slug },
        select: { id: true },
      });
      if (!found || found.id === excludedId) return slug;
    }
    throw new ConflictException('Không thể tạo đường dẫn duy nhất cho khu trọ');
  }

  /** Explicit mapping prevents clients from changing ownership or verification. */
  private toUpdateValues(input: UpdatePropertyDto): Partial<Property> {
    const values: Partial<Property> = {};
    if (input.name !== undefined) values.name = input.name;
    if (input.description !== undefined) values.description = input.description;
    if (input.address !== undefined) values.address = input.address;
    if (input.ward !== undefined) values.ward = input.ward;
    if (input.district !== undefined) values.district = input.district;
    if (input.city !== undefined) values.city = input.city;
    if (input.latitude !== undefined) values.latitude = String(input.latitude);
    if (input.longitude !== undefined) values.longitude = String(input.longitude);
    if (input.rules !== undefined) values.rules = input.rules;
    if (input.openingHours !== undefined) {
      values.openingHours = input.openingHours;
    }
    if (input.contactPhone !== undefined) {
      values.contactPhone = input.contactPhone;
    }
    return values;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const databaseError = error as { code?: unknown; errno?: unknown };
    return databaseError.code === 'ER_DUP_ENTRY' || databaseError.errno === 1062;
  }

  private isForeignKeyConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const databaseError = error as { code?: unknown; errno?: unknown };
    return (
      databaseError.code === 'ER_ROW_IS_REFERENCED_2' ||
      databaseError.errno === 1451
    );
  }
}

function slugify(value: string): string {
  const normalized = value
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized.slice(0, 191).replace(/-+$/g, '');
}

function presentNearbyPlace(place: NearbyPlace) {
  return {
    id: place.id,
    propertyId: place.propertyId,
    name: place.name,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    distanceMeters: place.distanceMeters,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function textOrNull(value: unknown, maximum = 120): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text.slice(0, maximum) : null;
}

function coordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

function addressPart(
  address: Record<string, unknown> | null,
  keys: string[],
): string | null {
  for (const key of keys) {
    const text = textOrNull(address?.[key]);
    if (text) return text;
  }
  return null;
}

function normalizeNominatimResults(payload: unknown): GeocodeItem[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .flatMap((value): GeocodeItem[] => {
      const place = asRecord(value);
      if (!place) return [];
      const displayName = textOrNull(place.display_name, 500);
      const latitude = coordinate(place.lat, -90, 90);
      const longitude = coordinate(place.lon, -180, 180);
      if (!displayName || latitude === null || longitude === null) return [];

      const address = asRecord(place.address);
      return [
        {
          displayName,
          latitude,
          longitude,
          ward: addressPart(address, ['quarter', 'neighbourhood', 'suburb']),
          district: addressPart(address, [
            'city_district',
            'district',
            'county',
            'suburb',
          ]),
          city: addressPart(address, [
            'city',
            'town',
            'village',
            'municipality',
            'state_district',
          ]),
        },
      ];
    })
    .slice(0, 5);
}

function normalizePhotonResults(payload: unknown): GeocodeItem[] {
  const root = asRecord(payload);
  const features = root?.features;
  if (!Array.isArray(features)) return [];

  return features
    .flatMap((value): GeocodeItem[] => {
      const feature = asRecord(value);
      const properties = asRecord(feature?.properties);
      const geometry = asRecord(feature?.geometry);
      const coordinates = geometry?.coordinates;
      if (!properties || !Array.isArray(coordinates)) return [];

      const longitude = coordinate(coordinates[0], -180, 180);
      const latitude = coordinate(coordinates[1], -90, 90);
      const displayName = uniqueDisplayName([
        properties.name,
        properties.street,
        properties.locality,
        properties.district,
        properties.city,
        properties.state,
        properties.country,
      ]);
      if (!displayName || latitude === null || longitude === null) return [];

      return [
        {
          displayName,
          latitude,
          longitude,
          ward: textOrNull(properties.locality),
          district: textOrNull(properties.district),
          city:
            textOrNull(properties.city) ??
            textOrNull(properties.state) ??
            textOrNull(properties.county),
        },
      ];
    })
    .slice(0, 5);
}

function uniqueDisplayName(parts: unknown[]): string | null {
  const seen = new Set<string>();
  const unique = parts.flatMap((part) => {
    const text = textOrNull(part, 160);
    const key = text?.toLocaleLowerCase('vi-VN');
    if (!text || !key || seen.has(key)) return [];
    seen.add(key);
    return [text];
  });
  return unique.length ? unique.join(', ').slice(0, 500) : null;
}

export function presentProperty(
  property: Property,
  options: { includeDetail?: boolean } = {},
) {
  const base = {
    id: property.id,
    landlordId: property.landlordId,
    slug: property.slug,
    name: property.name,
    description: property.description,
    address: property.address,
    ward: property.ward,
    district: property.district,
    city: property.city,
    latitude: property.latitude,
    longitude: property.longitude,
    rules: property.rules,
    openingHours: property.openingHours,
    contactPhone: property.contactPhone,
    verificationStatus: property.verificationStatus,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
    landlord: property.landlord
      ? presentPublicUserSummary(property.landlord)
      : null,
    _count: { rooms: property.rooms?.length ?? 0 },
  };

  if (!options.includeDetail) return base;

  return {
    ...base,
    rooms: (property.rooms ?? []).map((room) => ({
      id: room.id,
      code: room.code,
      name: room.name,
      price: room.price,
      status: room.status,
      availableSlots: room.availableSlots,
    })),
    nearbyPlaces: (property.nearbyPlaces ?? []).map((place) => ({
      id: place.id,
      propertyId: place.propertyId,
      name: place.name,
      category: place.category,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      distanceMeters: place.distanceMeters,
    })),
  };
}
