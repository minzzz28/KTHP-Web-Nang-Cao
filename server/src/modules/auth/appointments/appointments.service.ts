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
  In,
  Repository,
} from 'typeorm';
import {
  Notification,
  Room,
  ViewingAppointment,
} from '../../database/entities';
import {
  NotificationType,
  RoomStatus,
  UserRole,
  ViewingAppointmentStatus,
} from '../../database/enums/domain.enums';
import { AppointmentActionDto } from './dto/appointment-action.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { presentAppointment } from './appointment.presenter';

export type AppointmentActor = {
  id: number;
  fullName: string;
  role: UserRole;
};

export interface AppointmentListResult {
  data: { items: Array<ReturnType<typeof presentAppointment>> };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MANAGEABLE_STATUSES = [
  ViewingAppointmentStatus.PENDING,
  ViewingAppointmentStatus.ACCEPTED,
  ViewingAppointmentStatus.RESCHEDULED,
] as ViewingAppointmentStatus[];

type AppointmentRepositories = {
  appointments: Repository<ViewingAppointment>;
  rooms: Repository<Room>;
  notifications: Repository<Notification>;
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(ViewingAppointment)
    private readonly appointments: Repository<ViewingAppointment>,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    actor: AppointmentActor,
    query: ListAppointmentsQueryDto,
  ): Promise<AppointmentListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: FindOptionsWhere<ViewingAppointment> = {};
    if (query.status) where.status = query.status;

    if (actor.role === UserRole.STUDENT) {
      where.studentId = actor.id;
    } else if (actor.role === UserRole.LANDLORD) {
      where.landlordId = actor.id;
    } else if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem lịch hẹn');
    }

    const [appointments, total] = await this.appointments.findAndCount({
      where,
      relations: { room: { property: true }, student: true, landlord: true },
      order: { scheduledAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: { items: appointments.map(presentAppointment) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getForUser(actor: AppointmentActor, appointmentId: number) {
    const appointment = await this.findFull(this.appointments, appointmentId);
    this.requireParticipant(actor, appointment);
    return presentAppointment(appointment);
  }

  async create(actor: AppointmentActor, input: CreateAppointmentDto) {
    if (actor.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Chỉ sinh viên có thể đặt lịch xem phòng');
    }
    this.requireFuture(input.scheduledAt, 'Lịch xem phải ở tương lai');

    const appointment = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      // A room-level lock serializes duplicate checks for this room.  The SQL
      // schema has an index but no uniqueness constraint for active bookings.
      const room = await repositories.rooms.findOne({
        where: { id: input.roomId },
        relations: { property: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!room || room.status === RoomStatus.HIDDEN || !room.property) {
        throw new NotFoundException('Không tìm thấy phòng');
      }

      const duplicate = await repositories.appointments.findOneBy({
        roomId: room.id,
        studentId: actor.id,
        scheduledAt: input.scheduledAt,
        status: In(MANAGEABLE_STATUSES),
      });
      if (duplicate) {
        throw new ConflictException('Bạn đã có lịch xem phòng tại thời điểm này');
      }

      const appointment = await repositories.appointments.save(
        repositories.appointments.create({
          roomId: room.id,
          studentId: actor.id,
          landlordId: room.property.landlordId,
          scheduledAt: input.scheduledAt,
          proposedAt: null,
          status: ViewingAppointmentStatus.PENDING,
          studentNote: input.studentNote ?? null,
          landlordNote: null,
          respondedAt: null,
          cancelledAt: null,
        }),
      );
      await repositories.notifications.save(
        repositories.notifications.create({
          userId: room.property.landlordId,
          type: NotificationType.APPOINTMENT,
          title: 'Có lịch xem phòng mới',
          content: `${actor.fullName} đã đặt lịch xem phòng.`,
          linkUrl: '/appointments',
          isRead: false,
          readAt: null,
        }),
      );
      return this.findFull(repositories.appointments, appointment.id);
    });

    return presentAppointment(appointment);
  }

  async respond(
    actor: AppointmentActor,
    appointmentId: number,
    input: AppointmentActionDto,
  ) {
    if (actor.role !== UserRole.LANDLORD && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ chủ trọ có thể phản hồi lịch xem');
    }
    if (input.status === ViewingAppointmentStatus.RESCHEDULED) {
      if (!input.proposedAt) {
        throw new UnprocessableEntityException('Cần có thời gian đề xuất mới');
      }
      this.requireFuture(input.proposedAt, 'Thời gian đề xuất phải ở tương lai');
    }

    const updatedAppointment = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const appointment = await this.requireLockedAppointment(
        repositories.appointments,
        appointmentId,
      );
      if (
        actor.role !== UserRole.ADMIN &&
        appointment.landlordId !== actor.id
      ) {
        throw new NotFoundException('Không tìm thấy lịch xem');
      }
      this.requireManageableStatus(appointment);

      const result = await repositories.appointments.update(
        {
          id: appointment.id,
          status: In(MANAGEABLE_STATUSES),
          ...(actor.role === UserRole.ADMIN
            ? {}
            : { landlordId: actor.id }),
        },
        {
          status: input.status,
          proposedAt:
            input.status === ViewingAppointmentStatus.RESCHEDULED
              ? input.proposedAt ?? null
              : null,
          // Match the legacy nullish behavior: null does not erase a note.
          landlordNote: input.landlordNote ?? appointment.landlordNote,
          respondedAt: new Date(),
        },
      );
      if (!result.affected) {
        throw new ConflictException('Lịch xem này đã được cập nhật');
      }

      await repositories.notifications.save(
        repositories.notifications.create({
          userId: appointment.studentId,
          type: NotificationType.APPOINTMENT,
          title: 'Lịch xem phòng đã được phản hồi',
          content: this.responseNotificationContent(input.status),
          linkUrl: '/appointments',
          isRead: false,
          readAt: null,
        }),
      );
      return this.findFull(repositories.appointments, appointment.id);
    });

    return presentAppointment(updatedAppointment);
  }

  async cancel(actor: AppointmentActor, appointmentId: number) {
    if (actor.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Chỉ sinh viên đặt lịch mới có thể hủy');
    }

    const updatedAppointment = await this.dataSource.transaction(async (manager) => {
      const repositories = this.getRepositories(manager);
      const appointment = await this.requireLockedAppointment(
        repositories.appointments,
        appointmentId,
      );
      if (appointment.studentId !== actor.id) {
        throw new NotFoundException('Không tìm thấy lịch xem');
      }
      this.requireManageableStatus(appointment);

      const result = await repositories.appointments.update(
        {
          id: appointment.id,
          studentId: actor.id,
          status: In(MANAGEABLE_STATUSES),
        },
        {
          status: ViewingAppointmentStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      );
      if (!result.affected) {
        throw new ConflictException('Lịch xem này đã được cập nhật');
      }

      await repositories.notifications.save(
        repositories.notifications.create({
          userId: appointment.landlordId,
          type: NotificationType.APPOINTMENT,
          title: 'Lịch xem phòng đã bị hủy',
          content: `${actor.fullName} đã hủy lịch xem phòng.`,
          linkUrl: '/appointments',
          isRead: false,
          readAt: null,
        }),
      );
      return this.findFull(repositories.appointments, appointment.id);
    });

    return presentAppointment(updatedAppointment);
  }

  private getRepositories(manager: EntityManager): AppointmentRepositories {
    return {
      appointments: manager.getRepository(ViewingAppointment),
      rooms: manager.getRepository(Room),
      notifications: manager.getRepository(Notification),
    };
  }

  private findFull(
    repository: Repository<ViewingAppointment>,
    appointmentId: number,
  ): Promise<ViewingAppointment> {
    return repository
      .findOne({
        where: { id: appointmentId },
        relations: { room: { property: true }, student: true, landlord: true },
      })
      .then((appointment) => {
        if (!appointment) {
          throw new NotFoundException('Không tìm thấy lịch xem');
        }
        return appointment;
      });
  }

  private async requireLockedAppointment(
    repository: Repository<ViewingAppointment>,
    appointmentId: number,
  ): Promise<ViewingAppointment> {
    const appointment = await repository.findOne({
      where: { id: appointmentId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!appointment) {
      throw new NotFoundException('Không tìm thấy lịch xem');
    }
    return appointment;
  }

  private requireParticipant(
    actor: AppointmentActor,
    appointment: ViewingAppointment,
  ): void {
    if (
      actor.role !== UserRole.ADMIN &&
      appointment.studentId !== actor.id &&
      appointment.landlordId !== actor.id
    ) {
      // Use the same response as an absent appointment so sequential IDs do
      // not let a logged-in user enumerate other users' schedules.
      throw new NotFoundException('Không tìm thấy lịch xem');
    }
  }

  private requireManageableStatus(appointment: ViewingAppointment): void {
    if (!MANAGEABLE_STATUSES.includes(appointment.status)) {
      throw new ConflictException('Lịch xem này không thể cập nhật');
    }
  }

  private requireFuture(value: Date, message: string): void {
    if (!(value instanceof Date) || Number.isNaN(value.valueOf()) || value <= new Date()) {
      throw new UnprocessableEntityException(message);
    }
  }

  private responseNotificationContent(status: ViewingAppointmentStatus): string {
    const outcome =
      status === ViewingAppointmentStatus.ACCEPTED
        ? 'chấp nhận'
        : status === ViewingAppointmentStatus.REJECTED
          ? 'từ chối'
          : status === ViewingAppointmentStatus.RESCHEDULED
            ? 'đề xuất thời gian mới'
            : 'cập nhật';
    return `Lịch xem phòng của bạn đã được ${outcome}.`;
  }
}
