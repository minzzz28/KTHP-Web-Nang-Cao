import { Transform } from 'class-transformer';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const normalizeIdentifier = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const usernameOrEmailPattern = /^(?:[a-z0-9][a-z0-9._-]{2,29}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;

export class LoginDto {
  @Transform(normalizeIdentifier)
  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  @Matches(usernameOrEmailPattern, {
    message: 'Tên đăng nhập hoặc email không hợp lệ',
  })
  identifier?: string;

  // Compatibility with clients that still send `email` instead of `identifier`.
  @Transform(normalizeIdentifier)
  @ValidateIf((_input, value) => value !== undefined)
  @IsString()
  @MaxLength(191)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email không hợp lệ',
  })
  email?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
