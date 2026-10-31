import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  RoomStatus,
  RoomType,
} from '../../../database/enums/domain.enums';
import { RoomImageInputDto } from './room-image-input.dto';

const MAX_MONEY_VALUE = 9_999_999_999;

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizedRoomType(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toUpperCase().replace(/[ -]/g, '_');
  return (
    {
      PRIVATE: RoomType.PRIVATE_ROOM,
      ROOM: RoomType.PRIVATE_ROOM,
      SHARED: RoomType.SHARED_ROOM,
    }[normalized] ?? normalized
  );
}

function normalizedRoomStatus(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

function nullableNumber(value: unknown): unknown {
  return value === null || value === undefined || value === ''
    ? value === '' ? undefined : value
    : Number(value);
}

/**
 * Only fields that are actually persisted for a new room are accepted here.
 * Ownership and all audit values are derived on the server.
 */
export class CreateRoomDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  propertyId!: number;

  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  code!: string;

  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(10_000)
  description?: string | null;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(MAX_MONEY_VALUE)
  price!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  deposit!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10_000)
  area!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  availableSlots!: number;

  @Transform(({ value }) => normalizedRoomType(value))
  @IsEnum(RoomType)
  type!: RoomType;

  @IsOptional()
  @Transform(({ value }) => normalizedRoomStatus(value))
  @IsEnum(RoomStatus)
  status: RoomStatus = RoomStatus.AVAILABLE;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  electricityPrice!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  waterPrice!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  internetFee!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  parkingFee!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_MONEY_VALUE)
  serviceFee?: number;

  @IsOptional()
  @Transform(({ value }) => nullableNumber(value))
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  locationScore?: number | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  amenityIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => RoomImageInputDto)
  images?: RoomImageInputDto[];

  /** Compatibility with the older landlord form. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_host: true,
    },
    { each: true },
  )
  imageUrls?: string[];
}
