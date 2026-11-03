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
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Input accepted when a student creates a rental group. */
export class CreateRentalGroupDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(20)
  maxMembers!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(9_999_999_999)
  budgetPerPerson!: number;

  @Type(() => Date)
  @IsOptional()
  @IsDate()
  moveInDate?: Date | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  rules?: string | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Link nhóm Zalo không hợp lệ' })
  @MaxLength(500)
  zaloGroupUrl?: string | null;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Link nhóm Telegram không hợp lệ' })
  @MaxLength(500)
  telegramGroupUrl?: string | null;
}
