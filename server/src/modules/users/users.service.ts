import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LandlordProfile,
  StudentProfile,
  University,
  User,
} from '../../database/entities';
import { UserRole } from '../../database/enums/domain.enums';
import {
  OwnUser,
  PublicUser,
  presentOwnUser,
  presentPublicUser,
} from '../../common/presenters/user.presenter';
import { validateRequestDto } from '../../common/validation/validate-request-dto';
import { AuthenticatedUser } from '../auth/auth.types';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateLandlordProfileDto } from './dto/update-landlord-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

type DatabaseError = {
  code?: string;
  errno?: number;
  message?: string;
};

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as DatabaseError).code === 'ER_DUP_ENTRY' ||
      (error as DatabaseError).errno === 1062)
  );
}

function duplicateMessage(error: DatabaseError, fallback: string): string {
  const message = error.message ?? '';

  if (message.includes('users_phone_key')) return 'Số điện thoại đã được sử dụng';
  if (message.includes('student_profiles_student_code_key')) {
    return 'Mã sinh viên đã được sử dụng';
  }
  if (message.includes('student_profiles_school_email_key')) {
    return 'Email trường đã được sử dụng';
  }
  if (message.includes('landlord_profiles_national_id_key')) {
    return 'CCCD đã được sử dụng';
  }

  return fallback;
}

function invalidBody(message: string): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: 'Dữ liệu gửi lên không hợp lệ',
    errors: [{ field: 'body', message }],
  });
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfiles: Repository<StudentProfile>,
    @InjectRepository(LandlordProfile)
    private readonly landlordProfiles: Repository<LandlordProfile>,
    @InjectRepository(University)
    private readonly universities: Repository<University>,
  ) {}

  async getOwnProfile(userId: number): Promise<OwnUser> {
    const user = await this.findOwnUser(userId);
    return presentOwnUser(user, 'full');
  }

  async getPublicProfile(userId: number): Promise<PublicUser> {
    const user = await this.users.findOne({
      where: { id: userId },
      relations: {
        studentProfile: { university: true },
        landlordProfile: true,
      },
    });

    if (!user || user.role === UserRole.ADMIN) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return presentPublicUser(user);
  }

  async updateAccount(
    userId: number,
    input: UpdateAccountDto,
  ): Promise<OwnUser> {
    const changes: {
      fullName?: string;
      phone?: string | null;
      avatarUrl?: string | null;
    } = {};

    if (input.fullName !== undefined) changes.fullName = input.fullName;
    if (input.phone !== undefined) changes.phone = input.phone;
    if (input.avatarUrl !== undefined) changes.avatarUrl = input.avatarUrl;

    if (!Object.keys(changes).length) {
      throw invalidBody('Cần cung cấp ít nhất một trường để cập nhật');
    }

    if (changes.phone) {
      const owner = await this.users.findOne({
        where: { phone: changes.phone },
        select: { id: true },
      });
      if (owner && owner.id !== userId) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    try {
      const result = await this.users.update({ id: userId }, changes);
      if (!result.affected) throw new NotFoundException('Không tìm thấy người dùng');
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          duplicateMessage(error, 'Số điện thoại đã được sử dụng'),
        );
      }
      throw error;
    }

    return this.getOwnProfile(userId);
  }

  async updateProfile(
    user: AuthenticatedUser,
    input: unknown,
  ): Promise<OwnUser> {
    switch (user.role) {
      case UserRole.STUDENT:
        await this.updateStudentProfile(
          user.id,
          await validateRequestDto(UpdateStudentProfileDto, input),
        );
        break;
      case UserRole.LANDLORD:
        await this.updateLandlordProfile(
          user.id,
          await validateRequestDto(UpdateLandlordProfileDto, input),
        );
        break;
      default:
        throw new ForbiddenException('Tài khoản quản trị không có hồ sơ nghiệp vụ');
    }

    return this.getOwnProfile(user.id);
  }

  private async findOwnUser(userId: number): Promise<User> {
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

  private async updateStudentProfile(
    userId: number,
    input: UpdateStudentProfileDto,
  ): Promise<void> {
    if (input.universityId !== undefined && input.universityId !== null) {
      const university = await this.universities.findOneBy({
        id: input.universityId,
      });
      if (!university) {
        throw new NotFoundException('Không tìm thấy trường đại học');
      }
    }

    if (input.studentCode) {
      const owner = await this.studentProfiles.findOne({
        where: { studentCode: input.studentCode },
        select: { userId: true },
      });
      if (owner && owner.userId !== userId) {
        throw new ConflictException('Mã sinh viên đã được sử dụng');
      }
    }

    if (input.schoolEmail) {
      const owner = await this.studentProfiles.findOne({
        where: { schoolEmail: input.schoolEmail },
        select: { userId: true },
      });
      if (owner && owner.userId !== userId) {
        throw new ConflictException('Email trường đã được sử dụng');
      }
    }

    try {
      const existing = await this.studentProfiles.findOneBy({ userId });
      if (existing) {
        await this.studentProfiles.save(Object.assign(existing, input));
      } else {
        await this.studentProfiles.save(
          this.studentProfiles.create({ userId, ...input }),
        );
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          duplicateMessage(error, 'Dữ liệu hồ sơ sinh viên đã được sử dụng'),
        );
      }
      throw error;
    }
  }

  private async updateLandlordProfile(
    userId: number,
    input: UpdateLandlordProfileDto,
  ): Promise<void> {
    if (input.nationalId) {
      const owner = await this.landlordProfiles.findOne({
        where: { nationalId: input.nationalId },
        select: { userId: true },
      });
      if (owner && owner.userId !== userId) {
        throw new ConflictException('CCCD đã được sử dụng');
      }
    }

    try {
      const existing = await this.landlordProfiles.findOneBy({ userId });
      if (existing) {
        await this.landlordProfiles.save(Object.assign(existing, input));
      } else {
        await this.landlordProfiles.save(
          this.landlordProfiles.create({ userId, ...input }),
        );
      }
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          duplicateMessage(error, 'Dữ liệu hồ sơ chủ trọ đã được sử dụng'),
        );
      }
      throw error;
    }
  }
}
