import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateLandlordProfileDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(191)
  businessName?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  nationalId?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  contactAddress?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  bio?: string | null;
}
