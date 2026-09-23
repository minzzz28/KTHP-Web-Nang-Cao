import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateStudentProfileDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  studentCode?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  universityId?: number | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  schoolEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  faculty?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  academicYear?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hometown?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;
}