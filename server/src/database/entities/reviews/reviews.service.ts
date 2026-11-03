import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { Contract, ContractTenant, Notification, Review } from '../../database/entities';
import { ContractStatus, NotificationType, ReviewStatus, UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

export interface ReviewListResult {
  data: { items: ReturnType<typeof presentReview>[] };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

type ReviewRepositories = {
  contractTenants: Repository<ContractTenant>;
  contracts: Repository<Contract>;
  notifications: Repository<Notification>;
  reviews: Repository<Review>;
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListReviewsQueryDto): Promise<ReviewListResult> {
    const where: FindOptionsWhere<Review> = { status: ReviewStatus.PUBLISHED };
    if (query.roomId !== undefined) where.roomId = query.roomId;
    if (query.landlordId !== undefined) where.landlordId = query.landlordId;
    return this.listScoped(where, query);
  }

  async mine(actor: AuthenticatedUser, query: ListReviewsQueryDto): Promise<ReviewListResult> {
    const where: FindOptionsWhere<Review> = { status: ReviewStatus.PUBLISHED };
    if (actor.role === UserRole.STUDENT) where.studentId = actor.id;
    else if (actor.role === UserRole.LANDLORD) where.landlordId = actor.id;
    else if (actor.role !== UserRole.ADMIN) throw new ForbiddenException('Bạn không có quyền xem đánh giá');
    if (query.roomId !== undefined) where.roomId = query.roomId;
    if (query.landlordId !== undefined) where.landlordId = query.landlordId;
    return this.listScoped(where, query);
  }

  async create(actor: AuthenticatedUser, input: CreateReviewDto) {
    if (actor.role !== UserRole.STUDENT) throw new ForbiddenException('Chỉ sinh viên có thể đánh giá');
    try {
      const reviewId = await this.dataSource.transaction(async (manager) => {
        const repositories = this.repositories(manager);
        const contract = await repositories.contracts.findOne({ where: { id: input.contractId }, lock: { mode: 'pessimistic_write' } });
        if (!contract || ![ContractStatus.ACTIVE, ContractStatus.EXPIRED, ContractStatus.TERMINATED].includes(contract.status)) {
          throw new ForbiddenException('Bạn chỉ có thể đánh giá hợp đồng đã hoặc đang thuê');
        }
        const tenancy = await repositories.contractTenants.findOne({
          where: { contractId: contract.id, studentId: actor.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!tenancy) throw new ForbiddenException('Bạn chỉ có thể đánh giá hợp đồng đã hoặc đang thuê');
        const existing = await repositories.reviews.findOne({
          where: { contractId: contract.id, studentId: actor.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (existing) throw new ConflictException('Bạn đã đánh giá hợp đồng này');
        const review = await repositories.reviews.save(repositories.reviews.create({
          contractId: contract.id, studentId: actor.id, roomId: contract.roomId, landlordId: contract.landlordId,
          rating: input.rating, roomQuality: input.roomQuality, security: input.security, cleanliness: input.cleanliness,
          wifiQuality: input.wifiQuality, utilityPrice: input.utilityPrice, listingAccuracy: input.listingAccuracy,
          landlordAttitude: input.landlordAttitude, comment: input.comment ?? null, status: ReviewStatus.PUBLISHED,
          moderatedById: null, moderationNote: null, moderatedAt: null,
        }));
        await repositories.notifications.save(repositories.notifications.create({
          userId: contract.landlordId, type: NotificationType.REPORT, title: 'Có đánh giá mới',
          content: `${actor.fullName} đã gửi đánh giá cho phòng của bạn.`, linkUrl: `/reviews?roomId=${contract.roomId}`,
          isRead: false, readAt: null,
        }));
        return review.id;
      });
      return presentReview(await this.loadFull(reviewId));
    } catch (error) {
      if (this.isUnique(error)) throw new ConflictException('Bạn đã đánh giá hợp đồng này');
      throw error;
    }
  }

  async update(actor: AuthenticatedUser, reviewId: number, input: UpdateReviewDto) {
    if (actor.role !== UserRole.STUDENT) throw new ForbiddenException('Chỉ sinh viên có thể sửa đánh giá');
    const values = this.updateValues(input);
    if (!Object.keys(values).length) throw new UnprocessableEntityException('Cần có dữ liệu cập nhật');
    const id = await this.dataSource.transaction(async (manager) => {
      const repositories = this.repositories(manager);
      const review = await this.lockReview(repositories.reviews, reviewId);
      this.requireAuthor(actor, review);
      const result = await repositories.reviews.update({ id: review.id }, values);
      if (!result.affected) throw new ConflictException('Đánh giá đã thay đổi, vui lòng tải lại');
      return review.id;
    });
    return presentReview(await this.loadFull(id));
  }

  async hide(actor: AuthenticatedUser, reviewId: number) {
    if (actor.role !== UserRole.STUDENT) throw new ForbiddenException('Chỉ sinh viên có thể ẩn đánh giá');
    const id = await this.dataSource.transaction(async (manager) => {
      const repositories = this.repositories(manager);
      const review = await this.lockReview(repositories.reviews, reviewId);
      this.requireAuthor(actor, review);
      if (review.status !== ReviewStatus.HIDDEN) {
        const result = await repositories.reviews.update({ id: review.id }, { status: ReviewStatus.HIDDEN });
        if (!result.affected) throw new ConflictException('Đánh giá đã thay đổi, vui lòng tải lại');
      }
      return review.id;
    });
    return presentReview(await this.loadFull(id));
  }

  async moderate(actor: AuthenticatedUser, reviewId: number, input: ModerateReviewDto) {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenException('Chỉ admin có thể kiểm duyệt đánh giá');
    const id = await this.dataSource.transaction(async (manager) => {
      const repositories = this.repositories(manager);
      const review = await this.lockReview(repositories.reviews, reviewId);
      const result = await repositories.reviews.update({ id: review.id }, {
        status: input.status, moderatedById: actor.id, moderationNote: input.moderationNote ?? null, moderatedAt: new Date(),
      });
      if (!result.affected) throw new ConflictException('Đánh giá đã thay đổi, vui lòng tải lại');
      await repositories.notifications.save(repositories.notifications.create({
        userId: review.studentId, type: NotificationType.REPORT, title: 'Đánh giá đã được kiểm duyệt',
        content: `Đánh giá của bạn đã được ${input.status === ReviewStatus.PUBLISHED ? 'hiển thị' : 'ẩn'}.`,
        linkUrl: `/reviews/${review.id}`, isRead: false, readAt: null,
      }));
      return review.id;
    });
    return presentReview(await this.loadFull(id));
  }

  private async listScoped(where: FindOptionsWhere<Review>, query: ListReviewsQueryDto): Promise<ReviewListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [items, total] = await this.reviews.findAndCount({
      where, relations: this.fullRelations(), order: { createdAt: 'DESC' }, skip: (page - 1) * limit, take: limit,
    });
    return { data: { items: items.map(presentReview) }, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  private repositories(manager: EntityManager): ReviewRepositories {
    return {
      contractTenants: manager.getRepository(ContractTenant), contracts: manager.getRepository(Contract),
      notifications: manager.getRepository(Notification), reviews: manager.getRepository(Review),
    };
  }

  private fullRelations() { return { student: true, room: true, landlord: true, contract: true } as const; }

  private async loadFull(reviewId: number): Promise<Review> {
    const review = await this.reviews.findOne({ where: { id: reviewId }, relations: this.fullRelations() });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    return review;
  }

  private async lockReview(repository: Repository<Review>, reviewId: number): Promise<Review> {
    const review = await repository.findOne({ where: { id: reviewId }, lock: { mode: 'pessimistic_write' } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
    return review;
  }

  private requireAuthor(actor: AuthenticatedUser, review: Review): void {
    if (review.studentId !== actor.id) throw new ForbiddenException('Bạn không có quyền thao tác đánh giá này');
  }

  private updateValues(input: UpdateReviewDto): Partial<Review> {
    const values: Partial<Review> = {};
    if (input.rating !== undefined) values.rating = input.rating;
    if (input.roomQuality !== undefined) values.roomQuality = input.roomQuality;
    if (input.security !== undefined) values.security = input.security;
    if (input.cleanliness !== undefined) values.cleanliness = input.cleanliness;
    if (input.wifiQuality !== undefined) values.wifiQuality = input.wifiQuality;
    if (input.utilityPrice !== undefined) values.utilityPrice = input.utilityPrice;
    if (input.listingAccuracy !== undefined) values.listingAccuracy = input.listingAccuracy;
    if (input.landlordAttitude !== undefined) values.landlordAttitude = input.landlordAttitude;
    if (input.comment !== undefined) values.comment = input.comment;
    return values;
  }

  private isUnique(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const value = error as { code?: unknown; errno?: unknown };
    return value.code === 'ER_DUP_ENTRY' || value.errno === 1062;
  }
}

export function presentReview(review: Review) {
  return {
    id: review.id, contractId: review.contractId, studentId: review.studentId, roomId: review.roomId, landlordId: review.landlordId,
    rating: review.rating, roomQuality: review.roomQuality, security: review.security, cleanliness: review.cleanliness,
    wifiQuality: review.wifiQuality, utilityPrice: review.utilityPrice, listingAccuracy: review.listingAccuracy,
    landlordAttitude: review.landlordAttitude, comment: review.comment, status: review.status,
    createdAt: review.createdAt, updatedAt: review.updatedAt,
    student: review.student ? presentPublicUserSummary(review.student) : null,
    landlord: review.landlord ? presentPublicUserSummary(review.landlord) : null,
    room: review.room ? { id: review.room.id, name: review.room.name, code: review.room.code } : null,
    contract: review.contract ? { id: review.contract.id, contractNumber: review.contract.contractNumber } : null,
  };
}
