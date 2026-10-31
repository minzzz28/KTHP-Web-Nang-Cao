import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizedSlug(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

/** Intentionally excludes landlordId, verificationStatus and audit fields. */
export class UpdatePropertyDto {
  @IsOptional()
  @Transform(({ value }) => normalizedSlug(value))
  @IsString()
  @MaxLength(191)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(10_000)
  description?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(120)
  ward?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(120)
  district?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 })
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 7 })
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(10_000)
  rules?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(120)
  openingHours?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  contactPhone?: string | null;
}
