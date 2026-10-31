import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RoomType } from '../../../database/enums/domain.enums';

export const ROOM_SORTS = [
  'NEWEST',
  'PRICE_ASC',
  'PRICE_DESC',
  'DISTANCE_ASC',
  'RATING_DESC',
  'MATCH_DESC',
] as const;

export type RoomSort = (typeof ROOM_SORTS)[number];

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizedRoomType(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toUpperCase();
  return (
    {
      PRIVATE: RoomType.PRIVATE_ROOM,
      ROOM: RoomType.PRIVATE_ROOM,
      SHARED: RoomType.SHARED_ROOM,
    }[normalized] ?? normalized
  );
}

function queryBoolean(value: unknown): unknown {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return value;
}

export class ListRoomsQueryDto {
  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minCapacity?: number;

  @IsOptional()
  @Transform(({ value }) => normalizedRoomType(value))
  @IsEnum(RoomType)
  type?: RoomType;

  /** Lets the moderation screen include non-hidden unavailable listings. */
  @IsOptional()
  @Transform(({ value }) => queryBoolean(value))
  @IsBoolean()
  availableOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(300)
  amenitySlugs?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  universityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  radiusKm?: number;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(ROOM_SORTS)
  sort: RoomSort = 'NEWEST';
}
