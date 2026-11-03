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
} from 'class-validator';
import {
  Gender,
  RoommatePostStatus,
} from '../../../database/enums/domain.enums';

function normalizePostStatus(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toUpperCase();
  return normalized === 'ACTIVE' ? RoommatePostStatus.OPEN : normalized;
}

export class ListRoommatePostsQueryDto {
  @IsOptional()
  @Transform(({ value }) => normalizePostStatus(value))
  @IsEnum(RoommatePostStatus)
  status?: RoommatePostStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(255)
  area?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(191)
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  maxBudget?: number;

  @IsOptional()
  @IsEnum(Gender)
  preferredGender?: Gender;

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
}
