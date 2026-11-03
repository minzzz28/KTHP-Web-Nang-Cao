import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Gender } from '../../../database/enums/domain.enums';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateRoommatePostDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomId?: number | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(5)
  @MaxLength(191)
  title?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(10)
  @MaxLength(10_000)
  content?: string;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(255)
  area?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(9_999_999_999)
  budgetPerPerson?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  neededPeople?: number;

  @IsOptional()
  @IsEnum(Gender)
  preferredGender?: Gender | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  moveInDate?: Date | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(5_000)
  requirements?: string | null;
}
