import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
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
const normalizeCode = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

export class CreateUniversityDto {
  @Transform(normalizeCode)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  code!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(191)
  name!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  address!: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsUrl({}, { message: 'Website không hợp lệ' })
  @MaxLength(500)
  website?: string | null;

  @ValidateIf((_input, value) => value !== undefined)
  @IsBoolean()
  isPrimary?: boolean;
}
