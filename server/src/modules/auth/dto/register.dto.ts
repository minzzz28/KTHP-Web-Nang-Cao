import { Transform } from 'class-transformer';
import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../database/enums/domain.enums';

const usernamePattern = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const phonePattern = /^[+0-9() .-]+$/;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const normalizeIdentifier = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @Transform(normalizeIdentifier)
  @ValidateIf((_input, value) => value !== undefined && value !== null)
  @IsString()
  @Matches(usernamePattern, {
    message:
      'Tên đăng nhập phải gồm 3–30 ký tự chữ thường, số, dấu chấm, gạch dưới hoặc gạch ngang',
  })
  username?: string | null;

  @Transform(normalizeIdentifier)
  @ValidateIf((_input, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(191)
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email không hợp lệ',
  })
  email?: string | null;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(128)
  password!: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @ValidateIf((_input, value) => value !== undefined)
  @Transform(trim)
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @Matches(phonePattern, { message: 'Số điện thoại không hợp lệ' })
  phone?: string | null;

  @ValidateIf((_input, value) => value !== undefined)
  @IsIn([UserRole.STUDENT, UserRole.LANDLORD])
  role?: UserRole.STUDENT | UserRole.LANDLORD;
}
