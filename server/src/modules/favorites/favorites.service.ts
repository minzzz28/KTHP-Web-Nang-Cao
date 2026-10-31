import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { presentRoomList } from '../../common/presenters/room.presenter';
import { Favorite, Room } from '../../database/entities';
import { RoomStatus } from '../../database/enums/domain.enums';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { ListFavoritesQueryDto } from './dto/list-favorites-query.dto';

type DatabaseError = {
  code?: string;
  errno?: number;
};

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as DatabaseError).code === 'ER_DUP_ENTRY' ||
      (error as DatabaseError).errno === 1062)
  );
}

export interface FavoriteListResult {
  data: {
    items: Array<{
      id: number;
      studentId: number;
      roomId: number;
      createdAt: Date;
      room: ReturnType<typeof presentRoomList>;
    }>;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favorites: Repository<Favorite>,
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
  ) {}

  async list(
    studentId: number,
    query: ListFavoritesQueryDto,
  ): Promise<FavoriteListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [favorites, total] = await this.favorites.findAndCount({
      where: { studentId },
      relations: {
        room: {
          property: { landlord: true },
          images: true,
          amenities: { amenity: true },
          reviews: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: {
        items: favorites.map((favorite) => ({
          id: favorite.id,
          studentId: favorite.studentId,
          roomId: favorite.roomId,
          createdAt: favorite.createdAt,
          room: presentRoomList(favorite.room),
        })),
      },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async add(studentId: number, input: CreateFavoriteDto): Promise<Favorite> {
    const room = await this.rooms.findOneBy({ id: input.roomId });
    if (!room || room.status === RoomStatus.HIDDEN) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    const existing = await this.favorites.findOneBy({
      studentId,
      roomId: room.id,
    });
    if (existing) {
      throw new ConflictException('Phòng này đã có trong danh sách yêu thích');
    }

    try {
      return await this.favorites.save(
        this.favorites.create({ studentId, roomId: room.id }),
      );
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Phòng này đã có trong danh sách yêu thích');
      }
      throw error;
    }
  }

  async remove(studentId: number, roomId: number): Promise<void> {
    // The composite condition makes a favorite IDOR-safe without a separate
    // read that could race with deletion.
    const result = await this.favorites.delete({ studentId, roomId });
    if (!result.affected) {
      throw new NotFoundException('Phòng không có trong danh sách yêu thích');
    }
  }
}
