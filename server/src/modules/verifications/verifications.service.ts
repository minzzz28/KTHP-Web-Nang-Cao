import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { Notification, StudentProfile, User, VerificationRequest } from '../../database/entities';
import { NotificationType, UserRole, VerificationStatus, VerificationType } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateVerificationRequestDto } from './dto/create-verification-request.dto';
import { ListVerificationsQueryDto } from './dto/list-verifications-query.dto';
import { ReviewVerificationRequestDto } from './dto/review-verification-request.dto';

export interface VerificationListResult {
  data: { items: ReturnType<typeof presentVerification>[] };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

type Repositories = {
  notifications: Repository<Notification>;
  requests: Repository<VerificationRequest>;
  studentProfiles: Repository<StudentProfile>;
  users: Repository<User>;
};

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(VerificationRequest) private readonly requests: Repository<VerificationRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async mine(actor: AuthenticatedUser, query: ListVerificationsQueryDto): Promise<VerificationListResult> {
    return this.listScoped({ userId: actor.id, ...(query.status !== undefined ? { status: query.status } : {}) }, query, 'DESC');
  }

  async list(actor: AuthenticatedUser, query: ListVerificationsQueryDto): Promise<VerificationListResult> {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenException('Chỉ admin có thể xem danh sách xác minh');
    const where: FindOptionsWhere<VerificationRequest> = {};
    if (query.status !== undefined) where.status = query.status;
    if (query.type !== undefined) where.type = query.type;
    return this.listScoped(where, query, 'ASC');
  }

  async submit(actor: AuthenticatedUser, input: CreateVerificationRequestDto) {
    const type = this.expectedType(actor);
    if (input.type !== type) throw new UnprocessableEntityException('Loại xác minh không khớp vai trò tài khoản');
    this.assertEvidence(type, input);
    try {
      const requestId = await this.dataSource.transaction(async (manager) => {
        const repositories = this.repositories(manager);
        const user = await repositories.users.findOne({ where: { id: actor.id }, lock: { mode: 'pessimistic_write' } });
        if (!user) throw new NotFoundException('Không tìm thấy người dùng');
        const pending = await repositories.requests.findOne({ where: { userId: actor.id, status: VerificationStatus.PENDING }, lock: { mode: 'pessimistic_read' } });
        if (pending) throw new ConflictException('Bạn đã có yêu cầu xác minh đang chờ duyệt');
        const request = await repositories.requests.save(repositories.requests.create({
          userId: actor.id,
          reviewedById: null,
          type,
          status: VerificationStatus.PENDING,
          studentCode: input.studentCode ?? null,
          schoolEmail: input.schoolEmail ?? null,
          documentUrl: input.documentUrl ?? null,
          note: input.note ?? null,
          reviewerNote: null,
          reviewedAt: null,
        }));
        await repositories.users.update({ id: actor.id }, { verificationStatus: VerificationStatus.PENDING });
        return request.id;
      });
      return presentVerification(await this.loadFull(requestId));
    } catch (error) {
      if (this.isUnique(error)) throw new ConflictException('Thông tin sinh viên đã được dùng bởi tài khoản khác');
      throw error;
    }
  }

  async review(actor: AuthenticatedUser, requestId: number, input: ReviewVerificationRequestDto) {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenException('Chỉ admin có thể duyệt xác minh');
    try {
      const id = await this.dataSource.transaction(async (manager) => {
        const repositories = this.repositories(manager);
        const request = await repositories.requests.findOne({ where: { id: requestId }, lock: { mode: 'pessimistic_write' } });
        if (!request) throw new NotFoundException('Không tìm thấy yêu cầu xác minh');
        if (request.status !== VerificationStatus.PENDING) throw new ConflictException('Yêu cầu xác minh này đã được xử lý');
        const account = await repositories.users.findOne({ where: { id: request.userId }, lock: { mode: 'pessimistic_write' } });
        if (!account) throw new NotFoundException('Không tìm thấy người dùng');
        if (input.status === VerificationStatus.VERIFIED && request.type === VerificationType.STUDENT) {
          await this.applyStudentVerification(request, repositories);
        }
        const result = await repositories.requests.update({ id: request.id }, {
          status: input.status,
          reviewerNote: input.reviewerNote ?? null,
          reviewedById: actor.id,
          reviewedAt: new Date(),
        });
        if (!result.affected) throw new ConflictException('Yêu cầu xác minh đã thay đổi, vui lòng tải lại');
        await repositories.users.update({ id: request.userId }, { verificationStatus: input.status });
        await repositories.notifications.save(repositories.notifications.create({
          userId: request.userId,
          type: NotificationType.VERIFICATION,
          title: 'Yêu cầu xác minh đã được xử lý',
          content: `Yêu cầu xác minh của bạn đã ${input.status === VerificationStatus.VERIFIED ? 'được duyệt' : 'bị từ chối'}.`,
          linkUrl: request.type === VerificationType.LANDLORD ? '/landlord/profile' : '/student/profile',
          isRead: false,
          readAt: null,
        }));
        return request.id;
      });
      return presentVerification(await this.loadFull(id));
    } catch (error) {
      if (this.isUnique(error)) throw new ConflictException('Mã sinh viên hoặc email trường đã được dùng bởi tài khoản khác');
      throw error;
    }
  }

  private async listScoped(where: FindOptionsWhere<VerificationRequest>, query: ListVerificationsQueryDto, direction: 'ASC' | 'DESC'): Promise<VerificationListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [items, total] = await this.requests.findAndCount({
      where,
      relations: { user: true, reviewedBy: true },
      order: { createdAt: direction },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: { items: items.map(presentVerification) }, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  private expectedType(actor: AuthenticatedUser): VerificationType {
    if (actor.role === UserRole.STUDENT) return VerificationType.STUDENT;
    if (actor.role === UserRole.LANDLORD) return VerificationType.LANDLORD;
    throw new ForbiddenException('Tài khoản admin không cần xác minh');
  }

  private assertEvidence(type: VerificationType, input: CreateVerificationRequestDto): void {
    if (type === VerificationType.STUDENT && !input.studentCode && !input.schoolEmail && !input.documentUrl) {
      throw new UnprocessableEntityException('Cần cung cấp ít nhất một thông tin xác minh sinh viên');
    }
    if (type === VerificationType.LANDLORD && !input.documentUrl && !input.note) {
      throw new UnprocessableEntityException('Cần cung cấp tài liệu hoặc ghi chú xác minh chủ trọ');
    }
  }

  private async applyStudentVerification(request: VerificationRequest, repositories: Repositories): Promise<void> {
    if (request.studentCode) {
      const owner = await repositories.studentProfiles.findOne({ where: { studentCode: request.studentCode }, lock: { mode: 'pessimistic_write' } });
      if (owner && owner.userId !== request.userId) throw new ConflictException('Mã sinh viên đã được dùng bởi tài khoản khác');
    }
    if (request.schoolEmail) {
      const owner = await repositories.studentProfiles.findOne({ where: { schoolEmail: request.schoolEmail }, lock: { mode: 'pessimistic_write' } });
      if (owner && owner.userId !== request.userId) throw new ConflictException('Email trường đã được dùng bởi tài khoản khác');
    }
    const profile = await repositories.studentProfiles.findOne({ where: { userId: request.userId }, lock: { mode: 'pessimistic_write' } });
    const values = {
      ...(request.studentCode ? { studentCode: request.studentCode } : {}),
      ...(request.schoolEmail ? { schoolEmail: request.schoolEmail } : {}),
    };
    if (profile) await repositories.studentProfiles.update({ id: profile.id }, values);
    else await repositories.studentProfiles.save(repositories.studentProfiles.create({ userId: request.userId, studentCode: request.studentCode, schoolEmail: request.schoolEmail }));
  }

  private repositories(manager: EntityManager): Repositories {
    return {
      notifications: manager.getRepository(Notification),
      requests: manager.getRepository(VerificationRequest),
      studentProfiles: manager.getRepository(StudentProfile),
      users: manager.getRepository(User),
    };
  }

  private async loadFull(requestId: number): Promise<VerificationRequest> {
    const request = await this.requests.findOne({ where: { id: requestId }, relations: { user: true, reviewedBy: true } });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu xác minh');
    return request;
  }

  private isUnique(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const value = error as { code?: unknown; errno?: unknown };
    return value.code === 'ER_DUP_ENTRY' || value.errno === 1062;
  }
}

export function presentVerification(request: VerificationRequest) {
  return {
    id: request.id,
    userId: request.userId,
    reviewedById: request.reviewedById,
    type: request.type,
    status: request.status,
    studentCode: request.studentCode,
    schoolEmail: request.schoolEmail,
    documentUrl: request.documentUrl,
    note: request.note,
    reviewerNote: request.reviewerNote,
    reviewedAt: request.reviewedAt,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    user: request.user ? presentPublicUserSummary(request.user) : null,
    reviewedBy: request.reviewedBy ? presentPublicUserSummary(request.reviewedBy) : null,
  };
}
