import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import {
  Notification,
  Room,
  RoommatePost,
  RoommateRequest,
  User,
} from '../../database/entities';
import {
  NotificationType,
  RoommatePostStatus,
  RoommateRequestStatus,
  RoomStatus,
  UserRole,
  UserStatus,
} from '../../database/enums/domain.enums';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';
import { ListRoommateRequestsQueryDto } from './dto/list-roommate-requests-query.dto';
import { RoommateRequestAction } from './dto/respond-roommate-request.dto';
import { presentRoommateRequest } from './roommate-request.presenter';

export type RoommateRequestActor = {
  id: number;
  fullName: string;
};

type DatabaseError = { code?: string; errno?: number };
type RequestWhere =
  | FindOptionsWhere<RoommateRequest>
  | FindOptionsWhere<RoommateRequest>[];

function isUniqueConstraintError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ((error as DatabaseError).code === 'ER_DUP_ENTRY' ||
      (error as DatabaseError).errno === 1062)
  );
}

function activePairKey(firstUserId: number, secondUserId: number): string {
  return [firstUserId, secondUserId]
    .sort((left, right) => left - right)
    .join(':');
}

export interface RoommateRequestListResult {
  data: { items: Array<ReturnType<typeof presentRoommateRequest>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class RoommateRequestsService {
  constructor(
    @InjectRepository(RoommateRequest)
    private readonly requests: Repository<RoommateRequest>,
    private readonly dataSource: DataSource,
  ) {}

  listAll(
    studentId: number,
    query: ListRoommateRequestsQueryDto,
  ): Promise<RoommateRequestListResult> {
    const status = query.status ? { status: query.status } : {};
    return this.listByWhere(
      [
        { senderId: studentId, ...status },
        { recipientId: studentId, ...status },
      ],
      query,
    );
  }

  listSent(
    studentId: number,
    query: ListRoommateRequestsQueryDto,
  ): Promise<RoommateRequestListResult> {
    return this.listByWhere(
      { senderId: studentId, ...(query.status ? { status: query.status } : {}) },
      query,
    );
  }

  listReceived(
    studentId: number,
    query: ListRoommateRequestsQueryDto,
  ): Promise<RoommateRequestListResult> {
    return this.listByWhere(
      {
        recipientId: studentId,
        ...(query.status ? { status: query.status } : {}),
      },
      query,
    );
  }

  async send(
    actor: RoommateRequestActor,
    input: CreateRoommateRequestDto,
  ) {
    if (input.recipientId === actor.id) {
      throw new UnprocessableEntityException(
        'Không thể gửi lời mời cho chính bạn',
      );
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const users = manager.getRepository(User);
        const posts = manager.getRepository(RoommatePost);
        const rooms = manager.getRepository(Room);
        const requests = manager.getRepository(RoommateRequest);
        const notifications = manager.getRepository(Notification);

        const recipient = await users.findOneBy({ id: input.recipientId });
        if (
          !recipient ||
          recipient.role !== UserRole.STUDENT ||
          recipient.status !== UserStatus.ACTIVE
        ) {
          throw new UnprocessableEntityException('Người nhận không hợp lệ');
        }

        if (input.postId !== undefined && input.postId !== null) {
          const post = await posts.findOneBy({ id: input.postId });
          if (
            !post ||
            post.status !== RoommatePostStatus.OPEN ||
            post.studentId !== recipient.id
          ) {
            throw new UnprocessableEntityException(
              'Bài đăng ở ghép không còn hợp lệ',
            );
          }
        }

        if (input.roomId !== undefined && input.roomId !== null) {
          const room = await rooms.findOneBy({ id: input.roomId });
          if (!room || room.status === RoomStatus.HIDDEN) {
            throw new NotFoundException('Không tìm thấy phòng được chọn');
          }
        }

        const created = await requests.save(
          requests.create({
            senderId: actor.id,
            recipientId: recipient.id,
            postId: input.postId ?? null,
            roomId: input.roomId ?? null,
            message: input.message ?? null,
            status: RoommateRequestStatus.PENDING,
            activePairKey: activePairKey(actor.id, recipient.id),
            respondedAt: null,
          }),
        );

        await notifications.save(
          notifications.create({
            userId: recipient.id,
            type: NotificationType.ROOMMATE_REQUEST,
            title: 'Bạn có lời mời ở ghép mới',
            content: `${actor.fullName} đã gửi lời mời ở ghép cho bạn.`,
            linkUrl: '/student/roommate-requests',
            isRead: false,
            readAt: null,
          }),
        );

        return this.presentById(manager, created.id);
      });
    } catch (error) {
      // The database's unique active_pair_key constraint closes the race
      // between two simultaneous invitations for the same pair of students.
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Đã có lời mời đang chờ với người này');
      }
      throw error;
    }
  }

  async respond(
    actor: RoommateRequestActor,
    requestId: number,
    action: RoommateRequestAction,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(RoommateRequest);
      const notifications = manager.getRepository(Notification);
      const request = await this.findWithRelations(requests, requestId);

      // Treat requests outside the caller's pair as absent.  Beyond stopping
      // the mutation itself, this avoids exposing another pair's request ID
      // or whether it has already been answered.
      if (
        !request ||
        (request.senderId !== actor.id && request.recipientId !== actor.id)
      ) {
        throw new NotFoundException('Không tìm thấy lời mời ở ghép');
      }
      if (request.status !== RoommateRequestStatus.PENDING) {
        throw new ConflictException('Lời mời này đã được xử lý');
      }

      const status = this.resolveAction(actor.id, request, action);
      const criteria: FindOptionsWhere<RoommateRequest> = {
        id: request.id,
        status: RoommateRequestStatus.PENDING,
      };
      if (action === RoommateRequestAction.CANCEL) {
        criteria.senderId = actor.id;
      } else {
        criteria.recipientId = actor.id;
      }

      // Status and owner are both part of the update criteria.  This means a
      // competing accept/reject/cancel can update exactly once and emit at
      // most one response notification.
      const result = await requests.update(criteria, {
        status,
        activePairKey: null,
        respondedAt: new Date(),
      });
      if (!result.affected) {
        throw new ConflictException('Lời mời này đã được xử lý');
      }

      if (action !== RoommateRequestAction.CANCEL) {
        await notifications.save(
          notifications.create({
            userId: request.senderId,
            type: NotificationType.ROOMMATE_REQUEST_RESPONSE,
            title: 'Lời mời ở ghép đã được phản hồi',
            content: `${actor.fullName} đã ${
              status === RoommateRequestStatus.ACCEPTED
                ? 'chấp nhận'
                : 'từ chối'
            } lời mời ở ghép.`,
            linkUrl: '/student/roommate-requests',
            isRead: false,
            readAt: null,
          }),
        );
      }

      return this.presentById(manager, request.id);
    });
  }

  private async listByWhere(
    where: RequestWhere,
    query: ListRoommateRequestsQueryDto,
  ): Promise<RoommateRequestListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const [items, total] = await this.requests.findAndCount({
      where,
      relations: { sender: true, recipient: true, post: true, room: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: { items: items.map(presentRoommateRequest) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async presentById(manager: EntityManager, requestId: number) {
    const request = await this.findWithRelations(
      manager.getRepository(RoommateRequest),
      requestId,
    );
    if (!request) throw new NotFoundException('Không tìm thấy lời mời ở ghép');
    return presentRoommateRequest(request);
  }

  private findWithRelations(
    repository: Repository<RoommateRequest>,
    requestId: number,
  ): Promise<RoommateRequest | null> {
    return repository.findOne({
      where: { id: requestId },
      relations: { sender: true, recipient: true, post: true, room: true },
    });
  }

  private resolveAction(
    actorId: number,
    request: RoommateRequest,
    action: RoommateRequestAction,
  ): RoommateRequestStatus {
    if (action === RoommateRequestAction.CANCEL) {
      if (request.senderId !== actorId) {
        throw new ForbiddenException('Chỉ người gửi mới có thể hủy lời mời');
      }
      return RoommateRequestStatus.CANCELLED;
    }

    if (request.recipientId !== actorId) {
      throw new ForbiddenException(
        'Chỉ người nhận mới có thể phản hồi lời mời',
      );
    }
    if (action === RoommateRequestAction.ACCEPT) {
      return RoommateRequestStatus.ACCEPTED;
    }
    if (action === RoommateRequestAction.REJECT) {
      return RoommateRequestStatus.REJECTED;
    }

    throw new UnprocessableEntityException('Thao tác lời mời không hợp lệ');
  }
}
