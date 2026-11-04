import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const phonePattern = /^[+0-9() .-]+$/;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateAccountDto {
  @ValidateIf((_input, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @Matches(phonePattern, { message: 'Số điện thoại không hợp lệ' })
  phone?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsUrl({}, { message: 'Avatar URL không hợp lệ' })
  @MaxLength(500)
  avatarUrl?: string | null;
}
