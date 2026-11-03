import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Gender,
  SocialPreference,
} from '../../../database/enums/domain.enums';

function parseBoolean(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return value;
}

export class ListRoommatesQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  universityId?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(9_999_999_999)
  minBudget?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(9_999_999_999)
  maxBudget?: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(255)
  preferredArea?: string;

  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  @IsBoolean()
  isSmoking?: boolean;

  @Transform(({ value }) => parseBoolean(value))
  @IsOptional()
  @IsBoolean()
  hasPets?: boolean;

  @IsOptional()
  @IsEnum(SocialPreference)
  socialPreference?: SocialPreference;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
