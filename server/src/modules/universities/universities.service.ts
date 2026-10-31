import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StudentProfile } from '../../database/entities/identity/student-profile.entity';
import { University } from '../../database/entities/location/university.entity';
import { RoommateProfile } from '../../database/entities/social/roommate-profile.entity';
import { CreateUniversityDto } from './dto/create-university.dto';
import { ListUniversitiesQueryDto } from './dto/list-universities-query.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

export interface UniversityListResult {
  data: { items: University[] };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class UniversitiesService {
  constructor(
    @InjectRepository(University)
    private readonly universities: Repository<University>,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListUniversitiesQueryDto): Promise<UniversityListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const queryBuilder = this.universities
      .createQueryBuilder('university')
      .orderBy('university.isPrimary', 'DESC')
      .addOrderBy('university.name', 'ASC');

    if (query.q) {
      // The search term is always bound as a TypeORM parameter, never joined
      // into SQL. Wildcards remain a deliberate search feature.
      queryBuilder.where(
        '(university.name LIKE :search OR university.code LIKE :search OR university.address LIKE :search)',
        { search: `%${query.q}%` },
      );
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: { items },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findById(id: number): Promise<University> {
    const university = await this.universities.findOneBy({ id });

    if (!university) {
      throw new NotFoundException('Không tìm thấy trường đại học');
    }

    return university;
  }

  async create(input: CreateUniversityDto): Promise<University> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const universities = manager.getRepository(University);
        const count = await universities.count();
        const isPrimary = count === 0 || input.isPrimary === true;

        if (isPrimary && count > 0) {
          await universities
            .createQueryBuilder()
            .update(University)
            .set({ isPrimary: false })
            .execute();
        }

        return universities.save(
          universities.create({
            code: input.code,
            name: input.name,
            address: input.address,
            latitude: String(input.latitude),
            longitude: String(input.longitude),
            website: input.website ?? null,
            isPrimary,
          }),
        );
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Dữ liệu đã tồn tại');
      }
      throw error;
    }
  }

  async update(id: number, input: UpdateUniversityDto): Promise<University> {
    if (!Object.keys(input).length) {
      throw new UnprocessableEntityException({
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: [{ field: 'body', message: 'Cần có dữ liệu cập nhật' }],
      });
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const universities = manager.getRepository(University);
        const current = await universities.findOneBy({ id });
        if (!current) throw new NotFoundException('Không tìm thấy trường đại học');

        if (current.isPrimary && input.isPrimary === false) {
          const replacementCount = await universities
            .createQueryBuilder('university')
            .where('university.id <> :id', { id })
            .andWhere('university.isPrimary = :isPrimary', { isPrimary: true })
            .getCount();
          if (!replacementCount) {
            throw new UnprocessableEntityException(
              'Cần chọn một trường khác làm trung tâm trước khi bỏ ưu tiên trường này',
            );
          }
        }

        if (input.isPrimary === true) {
          await universities
            .createQueryBuilder()
            .update(University)
            .set({ isPrimary: false })
            .where('id <> :id', { id })
            .execute();
        }

        Object.assign(current, toUniversityChanges(input));
        return universities.save(current);
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Dữ liệu đã tồn tại');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const universities = manager.getRepository(University);
      const university = await universities.findOneBy({ id });
      if (!university) throw new NotFoundException('Không tìm thấy trường đại học');
      if (university.isPrimary) {
        throw new UnprocessableEntityException(
          'Không thể xóa trường đang là trung tâm hệ thống',
        );
      }

      const [studentProfiles, roommateProfiles] = await Promise.all([
        manager.getRepository(StudentProfile).count({ where: { universityId: id } }),
        manager.getRepository(RoommateProfile).count({ where: { universityId: id } }),
      ]);
      if (studentProfiles + roommateProfiles) {
        throw new ConflictException('Không thể xóa trường đang được hồ sơ sử dụng');
      }

      await universities.delete({ id });
    });
  }
}

type DatabaseError = { code?: string; errno?: number };

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as DatabaseError).code === 'ER_DUP_ENTRY' ||
      (error as DatabaseError).errno === 1062)
  );
}

function toUniversityChanges(input: UpdateUniversityDto): Partial<University> {
  const changes: Partial<University> = {};
  if (input.code !== undefined) changes.code = input.code;
  if (input.name !== undefined) changes.name = input.name;
  if (input.address !== undefined) changes.address = input.address;
  if (input.latitude !== undefined) changes.latitude = String(input.latitude);
  if (input.longitude !== undefined) changes.longitude = String(input.longitude);
  if (input.website !== undefined) changes.website = input.website;
  if (input.isPrimary !== undefined) changes.isPrimary = input.isPrimary;
  return changes;
}
