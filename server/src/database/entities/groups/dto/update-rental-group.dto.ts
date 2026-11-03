import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** A deliberately allowlisted partial update: a group's room cannot change. */
export class UpdateRentalGroupDto {
  @ValidateIf((_input, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name?: string;

  @ValidateIf((_input, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(20)
  maxMembers?: number;

  @ValidateIf((_input, value) => value !== undefined)
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(9_999_999_999)
  budgetPerPerson?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  moveInDate?: Date | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(10_000)
  rules?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsUrl({}, { message: 'Link nhóm Zalo không hợp lệ' })
  @MaxLength(500)
  zaloGroupUrl?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsUrl({}, { message: 'Link nhóm Telegram không hợp lệ' })
  @MaxLength(500)
  telegramGroupUrl?: string | null;
}
