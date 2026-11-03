import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  Gender,
  SocialPreference,
} from '../../../database/enums/domain.enums';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_BUDGET = 9_999_999_999;

/** Payload for a student's own roommate profile. */
export class CreateRoommateProfileDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  universityId?: number | null;

  @IsEnum(Gender)
  gender!: Gender;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  hometown?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  faculty?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  academicYear?: string | null;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_BUDGET)
  budgetMin!: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(MAX_BUDGET)
  budgetMax!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  preferredArea?: string | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(50)
  maxDistanceKm?: number | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isSmoking?: boolean = false;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  acceptsSmoking?: boolean = false;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  hasPets?: boolean = false;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  acceptsPets?: boolean = false;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  cooksOften?: boolean = false;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Giờ phải có dạng HH:mm' })
  sleepTime?: string | null;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, { message: 'Giờ phải có dạng HH:mm' })
  wakeUpTime?: string | null;

  @Type(() => Number)
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(5)
  cleanlinessLevel?: number = 3;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(SocialPreference)
  socialPreference?: SocialPreference = SocialPreference.BALANCED;

  @Type(() => Number)
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(10)
  preferredRoommates?: number = 1;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  isVisible?: boolean = true;
}
