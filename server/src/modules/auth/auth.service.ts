import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import {
  OwnUser,
  presentOwnUser,
} from '../../common/presenters/user.presenter';
import {
  LandlordProfile,
  StudentProfile,
  User,
} from '../../database/entities';
import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 12;
const INVALID_CREDENTIALS_MESSAGE =
  'Tên đăng nhập/email hoặc mật khẩu không hợp lệ';
// This is a non-secret bcrypt hash used only to keep failed login timing
// similar when no matching user exists.
const DUMMY_PASSWORD_HASH =
  '$2b$12$ERTdvdpInr4yAfyMpzaJseBDNOzce9Lh8/uj4xWppq48K7kdPpZOa';

export interface AuthResult {
  user: OwnUser;
  accessToken: string;
}

type DatabaseError = {
  code?: string;
  errno?: number;
  message?: string;
};

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'errno' in error) &&
    ((error as { code?: string }).code === 'ER_DUP_ENTRY' ||
      (error as { errno?: number }).errno === 1062)
  );
}

function duplicateMessage(error: DatabaseError): string {
  const message = error.message ?? '';
  if (message.includes('users_phone_key')) return 'Số điện thoại đã được sử dụng';
  if (
    message.includes('users_username_key') ||
    message.includes('users_email_key')
  ) {
    return 'Tên đăng nhập hoặc email đã được sử dụng';
  }

  return 'Dữ liệu đã tồn tại';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResult> {
    const role = input.role ?? UserRole.STUDENT;
    const username = input.username ?? null;
    const email = input.email ?? null;
    const phone = input.phone ?? null;

    if (!username && !email) {
      throw new UnprocessableEntityException({
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: [
          {
            field: 'username',
            message: 'Cần cung cấp tên đăng nhập hoặc email',
          },
        ],
      });
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    try {
      const userId = await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const [existingUsername, existingEmail, existingPhone] =
          await Promise.all([
            username ? users.findOneBy({ username }) : null,
            email ? users.findOneBy({ email }) : null,
            phone ? users.findOneBy({ phone }) : null,
          ]);

        if (existingUsername || existingEmail) {
          throw new ConflictException('Tên đăng nhập hoặc email đã được sử dụng');
        }
        if (existingPhone) {
          throw new ConflictException('Số điện thoại đã được sử dụng');
        }

        const created = await users.save(
          users.create({
            username,
            email,
            passwordHash,
            fullName: input.fullName,
            phone,
            role,
          }),
        );

        if (role === UserRole.STUDENT) {
          await manager.getRepository(StudentProfile).save({ userId: created.id });
        } else {
          await manager.getRepository(LandlordProfile).save({ userId: created.id });
        }

        return created.id;
      });

      return this.createAuthResult(await this.findUserWithProfiles(userId));
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(duplicateMessage(error));
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const identifier = input.identifier ?? input.email;
    if (!identifier) {
      throw new UnprocessableEntityException({
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: [
          {
            field: 'identifier',
            message: 'Cần nhập tên đăng nhập hoặc email',
          },
        ],
      });
    }

    const user = identifier
      ? await this.users.findOne({
          where: [{ username: identifier }, { email: identifier }],
          relations: {
            studentProfile: { university: true },
            landlordProfile: true,
          },
        })
      : null;
    const passwordMatches = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordMatches || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.createAuthResult(user);
  }

  async getMe(userId: number): Promise<OwnUser> {
    return presentOwnUser(await this.findUserWithProfiles(userId), 'summary');
  }

  async changePassword(userId: number, input: ChangePasswordDto): Promise<void> {
    const user = await this.users.findOneBy({ id: userId });

    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new UnprocessableEntityException('Mật khẩu hiện tại không đúng');
    }
    if (input.currentPassword === input.newPassword) {
      throw new UnprocessableEntityException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    user.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await this.users.save(user);
  }

  private async findUserWithProfiles(userId: number): Promise<User> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: {
        studentProfile: { university: true },
        landlordProfile: true,
      },
    });

    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  private async createAuthResult(user: User): Promise<AuthResult> {
    const accessToken = await this.jwtService.signAsync(
      { role: user.role },
      { subject: String(user.id), algorithm: 'HS256' },
    );

    return { user: presentOwnUser(user, 'summary'), accessToken };
  }
}
