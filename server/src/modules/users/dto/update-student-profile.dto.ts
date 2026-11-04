import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const toOptionalInteger = ({ value }: { value: unknown }) =>
  value === null || value === undefined ? value : Number(value);

export class UpdateStudentProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  studentCode?: string | null;

  @IsOptional()
  @Transform(toOptionalInteger)
  @IsInt()
  @Min(1)
  universityId?: number | null;

  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email trường không hợp lệ' })
  @MaxLength(191)
  schoolEmail?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  faculty?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  academicYear?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  hometown?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  bio?: string | null;
}
