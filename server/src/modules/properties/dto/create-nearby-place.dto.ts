import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { NearbyPlaceCategory } from '../../../database/enums/domain.enums';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateNearbyPlaceDto {
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name!: string;

  @IsEnum(NearbyPlaceCategory)
  category!: NearbyPlaceCategory;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000)
  distanceMeters?: number | null;
}
