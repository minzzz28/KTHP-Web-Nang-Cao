import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  In,
  IsNull,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';
import { presentRoomList } from '../../common/presenters/room.presenter';
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
  ContractStatus,
  NotificationType,
  RoomStatus,
  UserRole,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateRoomDto } from './dto/create-room.dto';
import { ListRoomsQueryDto, RoomSort } from './dto/list-rooms-query.dto';
import { RoomImageInputDto } from './dto/room-image-input.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import {
  removeUploadedRoomImages,
  type UploadedRoomImage,
  uploadedRoomImageUrl,
  validateUploadedRoomImages,
} from './room-image-upload';

type PublicRoom = ReturnType<typeof presentRoomList> & {
  distanceKm?: number;
};

export interface RoomListResult {
  data: { items: PublicRoom[] };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type RoomRepositories = {
  amenities: Repository<Amenity>;
  contracts: Repository<Contract>;
  contractTenants: Repository<ContractTenant>;
  favorites: Repository<Favorite>;
  notifications: Repository<Notification>;
  priceHistories: Repository<RoomPriceHistory>;
  properties: Repository<Property>;
  roomAmenities: Repository<RoomAmenity>;
  roomImages: Repository<RoomImage>;
  rooms: Repository<Room>;
};

type ImageInput = Pick<RoomImageInputDto, 'url' | 'altText' | 'isCover'>;

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(University)
    private readonly universities: Repository<University>,
    @InjectRepository(RoomPriceHistory)
    private readonly priceHistories: Repository<RoomPriceHistory>,
    @InjectRepository(NearbyPlace)
    private readonly nearbyPlacesRepository: Repository<NearbyPlace>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Reads the existing Prisma-created tables through TypeORM.  Search input is
   * deliberately evaluated against hydrated values rather than concatenated
   * into SQL, so it remains data rather than executable query syntax.
   */
  async list(query: ListRoomsQueryDto): Promise<RoomListResult> {
    const university = await this.findUniversity(query.universityId);
    const amenitySlugs = parseAmenitySlugs(query.amenitySlugs);
    const availableOnly = query.availableOnly !== false;
    const candidates = await this.rooms.find({
      where: availableOnly
        ? {
            status: RoomStatus.AVAILABLE,
            availableSlots: MoreThan(0),
          }
        : { status: Not(RoomStatus.HIDDEN) },
      relations: {
        property: { landlord: true },
        images: true,
        amenities: { amenity: true },
        reviews: true,
      },
      order: { createdAt: 'DESC' },
    });

    const rooms = candidates
      .filter((room) => isPubliclyDiscoverable(room, availableOnly))
      .filter((room) => matchesFilters(room, query, amenitySlugs))
      .map((room) => presentWithDistance(room, university))
      .filter((room) =>
        query.radiusKm === undefined || room.distanceKm === undefined
          ? true
          : room.distanceKm <= query.radiusKm,
      );

    sortRooms(rooms, query.sort ?? 'NEWEST');

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const total = rooms.length;
    const items = rooms.slice((page - 1) * limit, page * limit);

    return {
      data: { items },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findById(id: number, universityId?: number): Promise<PublicRoom> {
    const room = await this.rooms.findOne({
      where: { id },
      relations: {
        property: { landlord: true },
        images: true,
        amenities: { amenity: true },
        reviews: true,
      },
    });

    if (!room || room.status === RoomStatus.HIDDEN) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return presentWithDistance(room, await this.findUniversity(universityId));
  }

  /** Lists hidden and unavailable rooms for the owning landlord or an admin. */
  async mine(
    actor: AuthenticatedUser,
    query: ListRoomsQueryDto,
  ): Promise<RoomListResult> {
    this.requireRoomManager(actor);

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: FindOptionsWhere<Room> =
      actor.role === UserRole.ADMIN
        ? {}
        : { property: { landlordId: actor.id } };
    const [rooms, total] = await this.rooms.findAndCount({
      where,
      relations: this.fullRelations(),
      order: { updatedAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: { items: rooms.map((room) => presentRoomList(room)) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async create(actor: AuthenticatedUser, input: CreateRoomDto) {
    this.requireRoomManager(actor);
    this.assertCapacity(input.capacity, input.availableSlots, 0);
    const amenityIds = this.normalizeAmenityIds(input.amenityIds ?? []);
    const images = this.normalizeImages(input.images, input.imageUrls);

    try {
      const roomId = await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        // Property deletion takes the same row lock before checking for rooms.
        // This prevents a new room from slipping into a property being removed.
        const property = await this.requireLockedProperty(
          repositories.properties,
          input.propertyId,
        );
        this.requirePropertyOwner(actor, property);
        await this.requireAmenities(repositories.amenities, amenityIds);

        const status = input.status ?? RoomStatus.AVAILABLE;
        const room = await repositories.rooms.save(
          repositories.rooms.create({
            propertyId: property.id,
            code: input.code,
            name: input.name,
            description: input.description ?? null,
            price: String(input.price),
            deposit: String(input.deposit),
            area: String(input.area),
            capacity: input.capacity,
            availableSlots: input.availableSlots,
            type: input.type,
            status,
            electricityPrice: String(input.electricityPrice),
            waterPrice: String(input.waterPrice),
            internetFee: String(input.internetFee),
            parkingFee: String(input.parkingFee),
            serviceFee: String(input.serviceFee ?? 0),
            locationScore:
              input.locationScore === undefined || input.locationScore === null
                ? null
                : String(input.locationScore),
            publishedAt: status === RoomStatus.HIDDEN ? null : new Date(),
          }),
        );

        if (amenityIds.length > 0) {
          await repositories.roomAmenities.save(
            repositories.roomAmenities.create(
              amenityIds.map((amenityId) => ({
                roomId: room.id,
                amenityId,
              })),
            ),
          );
        }
        if (images.length > 0) {
          await repositories.roomImages.save(
            repositories.roomImages.create(this.imageRows(room.id, images)),
          );
        }
        await repositories.priceHistories.save(
          repositories.priceHistories.create({
            roomId: room.id,
            oldPrice: null,
            newPrice: String(input.price),
            changedById: actor.id,
            reason: 'Giá đăng ban đầu',
          }),
        );
        return room.id;
      });

      return presentRoomList(await this.loadFullRoom(this.rooms, roomId));
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Mã phòng đã tồn tại trong khu trọ này');
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    roomId: number,
    input: UpdateRoomDto,
  ) {
    this.requireRoomManager(actor);
    const values = this.toUpdateValues(input);
    const replacesAmenities = input.amenityIds !== undefined;
    const replacesImages =
      input.images !== undefined || input.imageUrls !== undefined;
    if (!Object.keys(values).length && !replacesAmenities && !replacesImages) {
      throw new UnprocessableEntityException('Cần có dữ liệu cập nhật');
    }

    const amenityIds = replacesAmenities
      ? this.normalizeAmenityIds(input.amenityIds ?? [])
      : [];
    const images = replacesImages
      ? this.normalizeImages(input.images, input.imageUrls)
      : [];

    try {
      const updatedRoomId = await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        // Contract activation also locks this same room.  It therefore sees
        // the final capacity after this transaction commits.
        const room = await this.requireLockedRoom(repositories.rooms, roomId);
        this.requirePropertyOwner(actor, room.property);

        if (replacesAmenities) {
          await this.requireAmenities(repositories.amenities, amenityIds);
        }

        if (
          input.capacity !== undefined ||
          input.availableSlots !== undefined
        ) {
          const activeTenantCount = await this.countActiveTenants(
            repositories,
            room.id,
          );
          this.assertCapacity(
            input.capacity ?? room.capacity,
            input.availableSlots ?? room.availableSlots,
            activeTenantCount,
          );
        }

        const priceChanged =
          values.price !== undefined &&
          Number(values.price) !== Number(room.price);
        if (
          values.status !== undefined &&
          values.status !== RoomStatus.HIDDEN &&
          !room.publishedAt
        ) {
          values.publishedAt = new Date();
        }

        const update = await repositories.rooms.update({ id: room.id }, values);
        if (!update.affected) {
          throw new ConflictException('Phòng đã thay đổi, vui lòng tải lại');
        }

        if (replacesAmenities) {
          await repositories.roomAmenities.delete({ roomId: room.id });
          if (amenityIds.length > 0) {
            await repositories.roomAmenities.save(
              repositories.roomAmenities.create(
                amenityIds.map((amenityId) => ({
                  roomId: room.id,
                  amenityId,
                })),
              ),
            );
          }
        }

        if (replacesImages) {
          await repositories.roomImages.delete({ roomId: room.id });
          if (images.length > 0) {
            await repositories.roomImages.save(
              repositories.roomImages.create(this.imageRows(room.id, images)),
            );
          }
        }

        if (priceChanged) {
          await repositories.priceHistories.save(
            repositories.priceHistories.create({
              roomId: room.id,
              oldPrice: room.price,
              newPrice: values.price ?? room.price,
              changedById: actor.id,
              reason: 'Chủ trọ cập nhật giá',
            }),
          );
          await this.notifyPriceChange(
            repositories,
            room.id,
            values.name ?? room.name,
          );
        }
        return room.id;
      });

      return presentRoomList(
        await this.loadFullRoom(this.rooms, updatedRoomId),
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Mã phòng đã tồn tại trong khu trọ này');
      }
      throw error;
    }
  }

  /** Keeps the existing history intact: deletion is always a soft hide. */
  async hide(actor: AuthenticatedUser, roomId: number) {
    this.requireRoomManager(actor);
    return this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const room = await this.requireLockedRoom(repositories.rooms, roomId);
      this.requirePropertyOwner(actor, room.property);

      if (room.status !== RoomStatus.HIDDEN) {
        const update = await repositories.rooms.update(
          { id: room.id },
          { status: RoomStatus.HIDDEN },
        );
        if (!update.affected) {
          throw new ConflictException('Phòng đã thay đổi, vui lòng tải lại');
        }
      }
      return { id: room.id, status: RoomStatus.HIDDEN };
    });
  }

  async uploadImages(
    actor: AuthenticatedUser,
    roomId: number,
    files: UploadedRoomImage[],
  ) {
    this.requireRoomManager(actor);
    if (!files.length) throw new UnprocessableEntityException('Cần tải lên ít nhất một ảnh');
    if (files.length > 8) throw new UnprocessableEntityException('Chỉ được tải lên tối đa 8 ảnh cho mỗi lần');
    try {
      return await this.dataSource.transaction(async (manager) => {
        const repositories = this.getRepositories(manager);
        // The room lock serializes appends, preserving unique image order and
        // ensuring an owner check cannot race with room changes.
        const room = await this.requireLockedRoom(repositories.rooms, roomId);
        this.requirePropertyOwner(actor, room.property);
        await validateUploadedRoomImages(files);
        const existing = await repositories.roomImages.find({
          where: { roomId: room.id },
          select: { sortOrder: true, isCover: true },
        });
        const startOrder = existing.length
          ? Math.max(...existing.map((image) => image.sortOrder)) + 1
          : 0;
        const hasCover = existing.some((image) => image.isCover);
        const created = await repositories.roomImages.save(
          repositories.roomImages.create(
            files.map((file, index) => ({
              roomId: room.id,
              url: uploadedRoomImageUrl(file),
              altText: `Ảnh phòng ${room.id}`,
              sortOrder: startOrder + index,
              isCover: !hasCover && index === 0,
            })),
          ),
        );
        return created.map((image) => ({
          id: image.id,
          roomId: image.roomId,
          url: image.url,
          altText: image.altText,
          sortOrder: image.sortOrder,
          isCover: image.isCover,
          createdAt: image.createdAt,
        }));
      });
    } catch (error) {
      await removeUploadedRoomImages(files);
      throw error;
    }
  }

  async priceHistory(roomId: number) {
    await this.findPublicRoom(roomId);

    const items = await this.priceHistories.find({
      where: { roomId },
      order: { changedAt: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      oldPrice: item.oldPrice,
      newPrice: item.newPrice,
      reason: item.reason,
      changedAt: item.changedAt,
    }));
  }

  async nearbyPlaces(roomId: number) {
    const room = await this.findPublicRoom(roomId);

    const items = await this.nearbyPlacesRepository.find({
      where: { propertyId: room.propertyId },
      order: { distanceMeters: 'ASC', name: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      propertyId: item.propertyId,
      name: item.name,
      category: item.category,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      distanceMeters: item.distanceMeters,
    }));
  }

  private fullRelations() {
    return {
      property: { landlord: true },
      images: true,
      amenities: { amenity: true },
      reviews: true,
    } as const;
  }

  private getRepositories(manager: EntityManager): RoomRepositories {
    return {
      amenities: manager.getRepository(Amenity),
      contracts: manager.getRepository(Contract),
      contractTenants: manager.getRepository(ContractTenant),
      favorites: manager.getRepository(Favorite),
      notifications: manager.getRepository(Notification),
      priceHistories: manager.getRepository(RoomPriceHistory),
      properties: manager.getRepository(Property),
      roomAmenities: manager.getRepository(RoomAmenity),
      roomImages: manager.getRepository(RoomImage),
      rooms: manager.getRepository(Room),
    };
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

  private async requireLockedRoom(
    repository: Repository<Room>,
    roomId: number,
  ): Promise<Room> {
    const room = await repository.findOne({
      where: { id: roomId },
      relations: { property: true },
      lock: { mode: 'pessimistic_write' },
    });
    if (!room || !room.property) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    return room;
  }

  private async loadFullRoom(
    repository: Repository<Room>,
    roomId: number,
  ): Promise<Room> {
    const room = await repository.findOne({
      where: { id: roomId },
      relations: this.fullRelations(),
    });
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    return room;
  }

  private requireRoomManager(actor: AuthenticatedUser): void {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ chủ trọ có thể quản lý phòng');
    }
  }

  private requirePropertyOwner(
    actor: AuthenticatedUser,
    property: Property,
  ): void {
    if (
      actor.role !== UserRole.ADMIN &&
      (actor.role !== UserRole.LANDLORD || property.landlordId !== actor.id)
    ) {
      throw new ForbiddenException('Bạn không có quyền thao tác phòng này');
    }
  }

  private normalizeAmenityIds(amenityIds: number[]): number[] {
    if (new Set(amenityIds).size !== amenityIds.length) {
      throw new UnprocessableEntityException('Không được lặp tiện ích');
    }
    return amenityIds;
  }

  private async requireAmenities(
    repository: Repository<Amenity>,
    amenityIds: number[],
  ): Promise<void> {
    if (amenityIds.length === 0) return;

    const count = await repository.countBy({ id: In(amenityIds) });
    if (count !== amenityIds.length) {
      throw new UnprocessableEntityException('Có tiện ích không tồn tại');
    }
  }

  private normalizeImages(
    images?: RoomImageInputDto[],
    imageUrls?: string[],
  ): ImageInput[] {
    const source: ImageInput[] = images
      ? images
      : (imageUrls ?? []).map((url) => ({ url }));
    const urls = source.map((image) => image.url.trim());
    if (new Set(urls).size !== urls.length) {
      throw new UnprocessableEntityException('Không được lặp URL ảnh');
    }
    const coverCount = source.filter((image) => image.isCover).length;
    if (coverCount > 1) {
      throw new UnprocessableEntityException('Chỉ được chọn một ảnh đại diện');
    }
    return source.map((image, index) => ({
      url: image.url.trim(),
      altText: image.altText?.trim() || null,
      isCover: Boolean(image.isCover) || (coverCount === 0 && index === 0),
    }));
  }

  private imageRows(roomId: number, images: ImageInput[]) {
    return images.map((image, index) => ({
      roomId,
      url: image.url,
      altText: image.altText ?? null,
      sortOrder: index,
      isCover: image.isCover === true,
    }));
  }

  private toUpdateValues(input: UpdateRoomDto): Partial<Room> {
    const values: Partial<Room> = {};
    if (input.code !== undefined) values.code = input.code;
    if (input.name !== undefined) values.name = input.name;
    if (input.description !== undefined) values.description = input.description;
    if (input.price !== undefined) values.price = String(input.price);
    if (input.deposit !== undefined) values.deposit = String(input.deposit);
    if (input.area !== undefined) values.area = String(input.area);
    if (input.capacity !== undefined) values.capacity = input.capacity;
    if (input.availableSlots !== undefined) {
      values.availableSlots = input.availableSlots;
    }
    if (input.type !== undefined) values.type = input.type;
    if (input.status !== undefined) values.status = input.status;
    if (input.electricityPrice !== undefined) {
      values.electricityPrice = String(input.electricityPrice);
    }
    if (input.waterPrice !== undefined) values.waterPrice = String(input.waterPrice);
    if (input.internetFee !== undefined) values.internetFee = String(input.internetFee);
    if (input.parkingFee !== undefined) values.parkingFee = String(input.parkingFee);
    if (input.serviceFee !== undefined) values.serviceFee = String(input.serviceFee);
    if (input.locationScore !== undefined) {
      values.locationScore =
        input.locationScore === null ? null : String(input.locationScore);
    }
    return values;
  }

  private async countActiveTenants(
    repositories: RoomRepositories,
    roomId: number,
  ): Promise<number> {
    const contracts = await repositories.contracts.find({
      where: { roomId, status: ContractStatus.ACTIVE },
      select: { id: true },
    });
    const contractIds = contracts.map((contract) => contract.id);
    if (contractIds.length === 0) return 0;

    return repositories.contractTenants.countBy({
      contractId: In(contractIds),
      moveOutDate: IsNull(),
    });
  }

  private assertCapacity(
    capacity: number,
    availableSlots: number,
    activeTenantCount: number,
  ): void {
    if (availableSlots > capacity) {
      throw new UnprocessableEntityException(
        'Số chỗ trống không thể lớn hơn sức chứa',
      );
    }
    if (capacity < activeTenantCount) {
      throw new UnprocessableEntityException(
        'Sức chứa không thể nhỏ hơn số người thuê đang hiệu lực',
      );
    }
    if (availableSlots > capacity - activeTenantCount) {
      throw new UnprocessableEntityException(
        'Số chỗ trống vượt quá sức chứa còn lại của phòng',
      );
    }
  }

  private async notifyPriceChange(
    repositories: RoomRepositories,
    roomId: number,
    roomName: string,
  ): Promise<void> {
    const favorites = await repositories.favorites.find({
      where: { roomId },
      select: { studentId: true },
    });
    if (favorites.length === 0) return;

    await repositories.notifications.save(
      repositories.notifications.create(
        favorites.map((favorite) => ({
          userId: favorite.studentId,
          type: NotificationType.PRICE_CHANGED,
          title: 'Giá phòng yêu thích đã thay đổi',
          content: `Giá phòng ${roomName} vừa được cập nhật.`,
          linkUrl: `/rooms/${roomId}`,
          isRead: false,
          readAt: null,
        })),
      ),
    );
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const databaseError = error as { code?: unknown; errno?: unknown };
    return databaseError.code === 'ER_DUP_ENTRY' || databaseError.errno === 1062;
  }

  private async findPublicRoom(roomId: number): Promise<Room> {
    const room = await this.rooms.findOne({
      where: { id: roomId },
      select: { id: true, propertyId: true, status: true },
    });

    if (!room || room.status === RoomStatus.HIDDEN) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return room;
  }

  private async findUniversity(id?: number): Promise<University | null> {
    if (!id) return null;

    const university = await this.universities.findOneBy({ id });
    if (!university) throw new NotFoundException('Không tìm thấy trường đại học');
    return university;
  }
}

function isPubliclyDiscoverable(room: Room, availableOnly: boolean): boolean {
  return availableOnly
    ? room.status === RoomStatus.AVAILABLE && room.availableSlots > 0
    : room.status !== RoomStatus.HIDDEN;
}

function matchesFilters(
  room: Room,
  query: ListRoomsQueryDto,
  amenitySlugs: string[],
): boolean {
  const price = Number(room.price);
  const area = Number(room.area);
  const property = room.property;
  const search = query.q?.toLocaleLowerCase();

  if (
    search &&
    ![
      room.name,
      room.code,
      room.description,
      property?.name,
      property?.address,
    ].some((value) => value?.toLocaleLowerCase().includes(search))
  ) {
    return false;
  }

  if (query.minPrice !== undefined && price < query.minPrice) return false;
  if (query.maxPrice !== undefined && price > query.maxPrice) return false;
  if (query.minArea !== undefined && area < query.minArea) return false;
  if (query.maxArea !== undefined && area > query.maxArea) return false;
  if (query.minCapacity !== undefined && room.capacity < query.minCapacity) {
    return false;
  }
  if (query.type !== undefined && room.type !== query.type) return false;
  if (
    query.district &&
    !property?.district?.toLocaleLowerCase().includes(query.district.toLocaleLowerCase())
  ) {
    return false;
  }
  if (
    query.city &&
    !property?.city?.toLocaleLowerCase().includes(query.city.toLocaleLowerCase())
  ) {
    return false;
  }

  if (amenitySlugs.length) {
    const availableAmenities = new Set(
      (room.amenities ?? [])
        .map((roomAmenity) => roomAmenity.amenity?.slug)
        .filter((slug): slug is string => Boolean(slug)),
    );
    if (!amenitySlugs.every((slug) => availableAmenities.has(slug))) {
      return false;
    }
  }

  return true;
}

function parseAmenitySlugs(value?: string): string[] {
  if (!value) return [];

  const slugs = [...new Set(value.split(',').map((slug) => slug.trim()).filter(Boolean))];
  if (slugs.some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
    throw new UnprocessableEntityException('amenitySlugs không hợp lệ');
  }

  return slugs;
}

function presentWithDistance(room: Room, university: University | null): PublicRoom {
  const presented = presentRoomList(room);
  if (!university) return presented;

  return {
    ...presented,
    distanceKm: Number(
      haversineDistanceKm(
        Number(room.property.latitude),
        Number(room.property.longitude),
        Number(university.latitude),
        Number(university.longitude),
      ).toFixed(1),
    ),
  };
}

function sortRooms(rooms: PublicRoom[], sort: RoomSort): void {
  if (sort === 'PRICE_ASC') {
    rooms.sort((left, right) => Number(left.price) - Number(right.price));
    return;
  }
  if (sort === 'PRICE_DESC') {
    rooms.sort((left, right) => Number(right.price) - Number(left.price));
    return;
  }
  if (sort === 'DISTANCE_ASC') {
    rooms.sort(
      (left, right) =>
        (left.distanceKm ?? Number.POSITIVE_INFINITY) -
        (right.distanceKm ?? Number.POSITIVE_INFINITY),
    );
    return;
  }
  if (sort === 'RATING_DESC' || sort === 'MATCH_DESC') {
    rooms.sort(
      (left, right) => (right.averageRating ?? 0) - (left.averageRating ?? 0),
    );
  }
}

function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
