import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { VerificationType } from '../../../database/enums/domain.enums';

function trimmed(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateVerificationRequestDto {
  @IsEnum(VerificationType)
  type!: VerificationType;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  studentCode?: string | null;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(191)
  schoolEmail?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  documentUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => trimmed(value))
  @IsString()
  @MaxLength(5_000)
  note?: string | null;
}
