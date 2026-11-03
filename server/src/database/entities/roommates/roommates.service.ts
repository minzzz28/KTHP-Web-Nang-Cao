import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  RoommateProfile,
  University,
} from '../../database/entities';
import {
  Gender,
  SocialPreference,
  UserRole,
  UserStatus,
} from '../../database/enums/domain.enums';
import { CreateRoommateProfileDto } from './dto/create-roommate-profile.dto';
import { ListRoommatesQueryDto } from './dto/list-roommates-query.dto';
import { UpdateRoommateProfileDto } from './dto/update-roommate-profile.dto';
import { presentRoommateProfile } from './roommate-profile.presenter';

type RoommateProfileInput =
  | CreateRoommateProfileDto
  | UpdateRoommateProfileDto;

type DatabaseError = { code?: string; errno?: number };

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as DatabaseError).code === 'ER_DUP_ENTRY' ||
      (error as DatabaseError).errno === 1062)
  );
}

export interface RoommateProfileListResult {
  data: { items: Array<ReturnType<typeof presentRoommateProfile>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class RoommatesService {
  constructor(
    @InjectRepository(RoommateProfile)
    private readonly profiles: Repository<RoommateProfile>,
    @InjectRepository(University)
    private readonly universities: Repository<University>,
  ) {}

  async list(
    query: ListRoommatesQueryDto,
  ): Promise<RoommateProfileListResult> {
    this.assertBudgetRange(query.minBudget, query.maxBudget);

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const builder = this.profiles
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.student', 'student')
      .leftJoinAndSelect('profile.university', 'university')
      .where('profile.isVisible = :isVisible', { isVisible: true })
      .andWhere('student.role = :studentRole', {
        studentRole: UserRole.STUDENT,
      })
      .andWhere('student.status = :studentStatus', {
        studentStatus: UserStatus.ACTIVE,
      });

    this.applyFilters(builder, query);

    const [items, total] = await builder
      .orderBy('profile.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: { items: items.map(presentRoommateProfile) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async mine(studentId: number) {
    const profile = await this.findForStudent(studentId);
    return profile ? presentRoommateProfile(profile) : null;
  }

  /**
   * POST keeps the legacy upsert behavior: submitting the form twice updates
   * the authenticated student's own profile instead of creating a duplicate.
   */
  async create(studentId: number, input: CreateRoommateProfileDto) {
    this.assertBudgetRange(input.budgetMin, input.budgetMax);
    await this.ensureUniversity(input.universityId);

    const existing = await this.profiles.findOneBy({ studentId });
    if (existing) {
      Object.assign(existing, this.toChanges(input));
      await this.profiles.save(existing);
      return this.presentForStudent(studentId);
    }

    try {
      await this.profiles.save(
        this.profiles.create(this.toNewProfile(studentId, input)),
      );
    } catch (error) {
      // The unique student_id key makes concurrent POST requests safe.  A
      // request that loses the race follows the same upsert behavior.
      if (!isUniqueConstraintError(error)) throw error;
      return this.update(studentId, input);
    }

    return this.presentForStudent(studentId);
  }

  async update(studentId: number, input: UpdateRoommateProfileDto) {
    if (!Object.keys(input).length) {
      throw new UnprocessableEntityException({
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: [{ field: 'body', message: 'Cần có dữ liệu cập nhật' }],
      });
    }

    await this.ensureUniversity(input.universityId);
    const existing = await this.profiles.findOneBy({ studentId });

    if (!existing) {
      const budgetMin = input.budgetMin ?? 0;
      const budgetMax = input.budgetMax ?? 10_000_000;
      this.assertBudgetRange(budgetMin, budgetMax);

      await this.profiles.save(
        this.profiles.create({
          studentId,
          universityId: input.universityId ?? null,
          gender: input.gender ?? Gender.PREFER_NOT_TO_SAY,
          hometown: input.hometown ?? null,
          faculty: input.faculty ?? null,
          academicYear: input.academicYear ?? null,
          budgetMin: String(budgetMin),
          budgetMax: String(budgetMax),
          preferredArea: input.preferredArea ?? null,
          maxDistanceKm:
            input.maxDistanceKm === undefined || input.maxDistanceKm === null
              ? null
              : String(input.maxDistanceKm),
          isSmoking: input.isSmoking ?? false,
          acceptsSmoking: input.acceptsSmoking ?? false,
          hasPets: input.hasPets ?? false,
          acceptsPets: input.acceptsPets ?? false,
          cooksOften: input.cooksOften ?? false,
          sleepTime: input.sleepTime ?? null,
          wakeUpTime: input.wakeUpTime ?? null,
          cleanlinessLevel: input.cleanlinessLevel ?? 3,
          socialPreference: input.socialPreference ?? SocialPreference.BALANCED,
          preferredRoommates: input.preferredRoommates ?? 1,
          bio: input.bio ?? null,
          isVisible: input.isVisible ?? true,
        }),
      );

      return this.presentForStudent(studentId);
    }

    const budgetMin = input.budgetMin ?? Number(existing.budgetMin);
    const budgetMax = input.budgetMax ?? Number(existing.budgetMax);
    this.assertBudgetRange(budgetMin, budgetMax);

    Object.assign(existing, this.toChanges(input));
    await this.profiles.save(existing);
    return this.presentForStudent(studentId);
  }

  private async ensureUniversity(
    universityId: number | null | undefined,
  ): Promise<void> {
    if (universityId === undefined || universityId === null) return;

    const university = await this.universities.findOneBy({ id: universityId });
    if (!university) throw new NotFoundException('Không tìm thấy trường đại học');
  }

  private async presentForStudent(studentId: number) {
    const profile = await this.findForStudent(studentId);
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ ở ghép');
    }

    return presentRoommateProfile(profile);
  }

  private findForStudent(studentId: number): Promise<RoommateProfile | null> {
    return this.profiles.findOne({
      where: { studentId },
      relations: { student: true, university: true },
    });
  }

  private applyFilters(
    builder: SelectQueryBuilder<RoommateProfile>,
    query: ListRoommatesQueryDto,
  ): void {
    if (query.universityId !== undefined) {
      builder.andWhere('profile.universityId = :universityId', {
        universityId: query.universityId,
      });
    }
    if (query.gender) {
      builder.andWhere('profile.gender = :gender', { gender: query.gender });
    }
    if (query.preferredArea) {
      // Query parameters prevent search text from becoming part of SQL syntax.
      builder.andWhere('profile.preferredArea LIKE :preferredArea', {
        preferredArea: `%${query.preferredArea}%`,
      });
    }
    if (query.isSmoking !== undefined) {
      builder.andWhere('profile.isSmoking = :isSmoking', {
        isSmoking: query.isSmoking,
      });
    }
    if (query.hasPets !== undefined) {
      builder.andWhere('profile.hasPets = :hasPets', { hasPets: query.hasPets });
    }
    if (query.socialPreference) {
      builder.andWhere('profile.socialPreference = :socialPreference', {
        socialPreference: query.socialPreference,
      });
    }
    if (query.minBudget !== undefined) {
      builder.andWhere('profile.budgetMax >= :minBudget', {
        minBudget: query.minBudget,
      });
    }
    if (query.maxBudget !== undefined) {
      builder.andWhere('profile.budgetMin <= :maxBudget', {
        maxBudget: query.maxBudget,
      });
    }
  }

  private assertBudgetRange(
    budgetMin: number | undefined,
    budgetMax: number | undefined,
  ): void {
    if (
      budgetMin !== undefined &&
      budgetMax !== undefined &&
      budgetMin > budgetMax
    ) {
      throw new UnprocessableEntityException('Ngân sách tối đa không hợp lệ');
    }
  }

  private toNewProfile(
    studentId: number,
    input: CreateRoommateProfileDto,
  ): Partial<RoommateProfile> {
    return {
      studentId,
      universityId: input.universityId ?? null,
      gender: input.gender,
      hometown: input.hometown ?? null,
      faculty: input.faculty ?? null,
      academicYear: input.academicYear ?? null,
      budgetMin: String(input.budgetMin),
      budgetMax: String(input.budgetMax),
      preferredArea: input.preferredArea ?? null,
      maxDistanceKm:
        input.maxDistanceKm === undefined || input.maxDistanceKm === null
          ? null
          : String(input.maxDistanceKm),
      isSmoking: input.isSmoking ?? false,
      acceptsSmoking: input.acceptsSmoking ?? false,
      hasPets: input.hasPets ?? false,
      acceptsPets: input.acceptsPets ?? false,
      cooksOften: input.cooksOften ?? false,
      sleepTime: input.sleepTime ?? null,
      wakeUpTime: input.wakeUpTime ?? null,
      cleanlinessLevel: input.cleanlinessLevel ?? 3,
      socialPreference: input.socialPreference ?? SocialPreference.BALANCED,
      preferredRoommates: input.preferredRoommates ?? 1,
      bio: input.bio ?? null,
      isVisible: input.isVisible ?? true,
    };
  }

  private toChanges(input: RoommateProfileInput): Partial<RoommateProfile> {
    const changes: Partial<RoommateProfile> = {};

    if (input.universityId !== undefined) changes.universityId = input.universityId;
    if (input.gender !== undefined) changes.gender = input.gender;
    if (input.hometown !== undefined) changes.hometown = input.hometown;
    if (input.faculty !== undefined) changes.faculty = input.faculty;
    if (input.academicYear !== undefined) {
      changes.academicYear = input.academicYear;
    }
    if (input.budgetMin !== undefined) changes.budgetMin = String(input.budgetMin);
    if (input.budgetMax !== undefined) changes.budgetMax = String(input.budgetMax);
    if (input.preferredArea !== undefined) {
      changes.preferredArea = input.preferredArea;
    }
    if (input.maxDistanceKm !== undefined) {
      changes.maxDistanceKm =
        input.maxDistanceKm === null ? null : String(input.maxDistanceKm);
    }
    if (input.isSmoking !== undefined) changes.isSmoking = input.isSmoking;
    if (input.acceptsSmoking !== undefined) {
      changes.acceptsSmoking = input.acceptsSmoking;
    }
    if (input.hasPets !== undefined) changes.hasPets = input.hasPets;
    if (input.acceptsPets !== undefined) changes.acceptsPets = input.acceptsPets;
    if (input.cooksOften !== undefined) changes.cooksOften = input.cooksOften;
    if (input.sleepTime !== undefined) changes.sleepTime = input.sleepTime;
    if (input.wakeUpTime !== undefined) changes.wakeUpTime = input.wakeUpTime;
    if (input.cleanlinessLevel !== undefined) {
      changes.cleanlinessLevel = input.cleanlinessLevel;
    }
    if (input.socialPreference !== undefined) {
      changes.socialPreference = input.socialPreference;
    }
    if (input.preferredRoommates !== undefined) {
      changes.preferredRoommates = input.preferredRoommates;
    }
    if (input.bio !== undefined) changes.bio = input.bio;
    if (input.isVisible !== undefined) changes.isVisible = input.isVisible;

    return changes;
  }
}
