import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { Notification, Report, Review, Room, RoommatePost, User } from '../../database/entities';
import { NotificationType, ReportStatus, ReportTargetType, RoomStatus, UserRole } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { ProcessReportDto } from './dto/process-report.dto';

export interface ReportListResult {
  data: { items: ReturnType<typeof presentReport>[] };
  meta: { page: number; limit: number; total: number; totalPages: number };
}

type Repositories = {
  notifications: Repository<Notification>;
  reports: Repository<Report>;
  reviews: Repository<Review>;
  rooms: Repository<Room>;
  roommatePosts: Repository<RoommatePost>;
  users: Repository<User>;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    private readonly dataSource: DataSource,
  ) {}

  async list(actor: AuthenticatedUser, query: ListReportsQueryDto): Promise<ReportListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: FindOptionsWhere<Report> = {};
    if (actor.role !== UserRole.ADMIN) where.reporterId = actor.id;
    if (query.status !== undefined) where.status = query.status;
    const [items, total] = await this.reports.findAndCount({
      where,
      relations: this.relations(),
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: { items: items.map(presentReport) },
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getForUser(actor: AuthenticatedUser, reportId: number) {
    const report = await this.loadFull(reportId);
    if (actor.role !== UserRole.ADMIN && report.reporterId !== actor.id) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo này');
    }
    return presentReport(report);
  }

  async create(actor: AuthenticatedUser, input: CreateReportDto) {
    this.assertTargetShape(input);
    const reportId = await this.dataSource.transaction(async (manager) => {
      const repositories = this.repositories(manager);
      await this.assertTargetExists(actor, input, repositories);
      const report = await repositories.reports.save(repositories.reports.create({
        reporterId: actor.id,
        targetType: input.targetType,
        targetUserId: input.targetType === ReportTargetType.USER ? input.targetUserId! : null,
        roomId: input.targetType === ReportTargetType.ROOM ? input.roomId! : null,
        roommatePostId: input.targetType === ReportTargetType.ROOMMATE_POST ? input.roommatePostId! : null,
        reviewId: input.targetType === ReportTargetType.REVIEW ? input.reviewId! : null,
        reason: input.reason,
        description: input.description ?? null,
        evidenceUrl: input.evidenceUrl ?? null,
        status: ReportStatus.PENDING,
        reviewedById: null,
        adminNote: null,
        resolvedAt: null,
      }));
      return report.id;
    });
    return presentReport(await this.loadFull(reportId));
  }

  async process(actor: AuthenticatedUser, reportId: number, input: ProcessReportDto) {
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenException('Chỉ admin có thể xử lý báo cáo');
    const id = await this.dataSource.transaction(async (manager) => {
      const repositories = this.repositories(manager);
      const report = await repositories.reports.findOne({ where: { id: reportId }, lock: { mode: 'pessimistic_write' } });
      if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
      if ([ReportStatus.RESOLVED, ReportStatus.REJECTED].includes(report.status)) {
        throw new ConflictException('Báo cáo đã được xử lý xong');
      }
      const resolved = input.status === ReportStatus.RESOLVED || input.status === ReportStatus.REJECTED;
      const result = await repositories.reports.update({ id: report.id }, {
        status: input.status,
        adminNote: input.adminNote,
        reviewedById: actor.id,
        resolvedAt: resolved ? new Date() : null,
      });
      if (!result.affected) throw new ConflictException('Báo cáo đã thay đổi, vui lòng tải lại');
      await repositories.notifications.save(repositories.notifications.create({
        userId: report.reporterId,
        type: NotificationType.REPORT,
        title: 'Báo cáo đã được cập nhật',
        content: `Báo cáo của bạn đang ở trạng thái ${input.status}.`,
        linkUrl: `/reports/${report.id}`,
        isRead: false,
        readAt: null,
      }));
      return report.id;
    });
    return presentReport(await this.loadFull(id));
  }

  private assertTargetShape(input: CreateReportDto): void {
    const targets = [
      [ReportTargetType.USER, input.targetUserId],
      [ReportTargetType.ROOM, input.roomId],
      [ReportTargetType.ROOMMATE_POST, input.roommatePostId],
      [ReportTargetType.REVIEW, input.reviewId],
    ].filter(([, value]) => value !== undefined && value !== null);
    if (targets.length !== 1 || targets[0][0] !== input.targetType) {
      throw new UnprocessableEntityException('Loại báo cáo phải khớp chính xác với một đối tượng báo cáo');
    }
  }

  private async assertTargetExists(actor: AuthenticatedUser, input: CreateReportDto, repositories: Repositories): Promise<void> {
    if (input.targetType === ReportTargetType.USER) {
      if (input.targetUserId === actor.id) throw new UnprocessableEntityException('Không thể báo cáo chính mình');
      const user = await repositories.users.findOne({ where: { id: input.targetUserId! }, lock: { mode: 'pessimistic_read' } });
      if (!user) throw new NotFoundException('Không tìm thấy người dùng bị báo cáo');
      return;
    }
    if (input.targetType === ReportTargetType.ROOM) {
      const room = await repositories.rooms.findOne({ where: { id: input.roomId! }, lock: { mode: 'pessimistic_read' } });
      if (!room || room.status === RoomStatus.HIDDEN) throw new NotFoundException('Không tìm thấy phòng bị báo cáo');
      return;
    }
    if (input.targetType === ReportTargetType.ROOMMATE_POST) {
      const post = await repositories.roommatePosts.findOne({ where: { id: input.roommatePostId! }, lock: { mode: 'pessimistic_read' } });
      if (!post) throw new NotFoundException('Không tìm thấy bài đăng bị báo cáo');
      return;
    }
    const review = await repositories.reviews.findOne({ where: { id: input.reviewId! }, lock: { mode: 'pessimistic_read' } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá bị báo cáo');
  }

  private repositories(manager: EntityManager): Repositories {
    return {
      notifications: manager.getRepository(Notification),
      reports: manager.getRepository(Report),
      reviews: manager.getRepository(Review),
      rooms: manager.getRepository(Room),
      roommatePosts: manager.getRepository(RoommatePost),
      users: manager.getRepository(User),
    };
  }

  private relations() {
    return { reporter: true, targetUser: true, room: { property: true }, roommatePost: true, review: true, reviewedBy: true } as const;
  }

  private async loadFull(reportId: number): Promise<Report> {
    const report = await this.reports.findOne({ where: { id: reportId }, relations: this.relations() });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    return report;
  }
}

export function presentReport(report: Report) {
  return {
    id: report.id,
    reporterId: report.reporterId,
    targetType: report.targetType,
    targetUserId: report.targetUserId,
    roomId: report.roomId,
    roommatePostId: report.roommatePostId,
    reviewId: report.reviewId,
    reason: report.reason,
    description: report.description,
    evidenceUrl: report.evidenceUrl,
    status: report.status,
    reviewedById: report.reviewedById,
    adminNote: report.adminNote,
    resolvedAt: report.resolvedAt,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter: report.reporter ? presentPublicUserSummary(report.reporter) : null,
    targetUser: report.targetUser ? presentPublicUserSummary(report.targetUser) : null,
    room: report.room ? { id: report.room.id, name: report.room.name, code: report.room.code, property: report.room.property ? { id: report.room.property.id, name: report.room.property.name } : null } : null,
    roommatePost: report.roommatePost ? { id: report.roommatePost.id, title: report.roommatePost.title } : null,
    review: report.review ? { id: report.review.id, rating: report.review.rating, comment: report.review.comment } : null,
    reviewedBy: report.reviewedBy ? presentPublicUserSummary(report.reviewedBy) : null,
  };
}
