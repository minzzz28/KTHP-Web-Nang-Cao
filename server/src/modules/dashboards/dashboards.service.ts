import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { presentRoomList } from '../../common/presenters/room.presenter';
import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import {
  Contract,
  Favorite,
  Invoice,
  Property,
  Report,
  Room,
  RoommateRequest,
  User,
  VerificationRequest,
  ViewingAppointment,
} from '../../database/entities';
import {
  ContractStatus,
  InvoiceStatus,
  ReportStatus,
  RoomStatus,
  RoommateRequestStatus,
  UserRole,
  VerificationStatus,
  ViewingAppointmentStatus,
} from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class DashboardsService {
  constructor(
    private readonly roomsService: RoomsService,
    @InjectRepository(Favorite)
    private readonly favorites: Repository<Favorite>,
    @InjectRepository(ViewingAppointment)
    private readonly appointments: Repository<ViewingAppointment>,
    @InjectRepository(RoommateRequest)
    private readonly roommateRequests: Repository<RoommateRequest>,
    @InjectRepository(Invoice)
    private readonly invoices: Repository<Invoice>,
    @InjectRepository(Room)
    private readonly rooms: Repository<Room>,
    @InjectRepository(Contract)
    private readonly contracts: Repository<Contract>,
    @InjectRepository(Property)
    private readonly properties: Repository<Property>,
    @InjectRepository(VerificationRequest)
    private readonly verificationRequests: Repository<VerificationRequest>,
    @InjectRepository(Report)
    private readonly reports: Repository<Report>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async student(user: AuthenticatedUser) {
    const now = new Date();
    const [recommendations, favoriteCount, appointments, roommateRequests, unpaidInvoices] =
      await Promise.all([
        this.roomsService.list({ page: 1, limit: 4, sort: 'NEWEST' }),
        this.favorites.count({ where: { studentId: user.id } }),
        this.appointments.find({
          where: {
            studentId: user.id,
            status: In([
              ViewingAppointmentStatus.PENDING,
              ViewingAppointmentStatus.ACCEPTED,
              ViewingAppointmentStatus.RESCHEDULED,
            ]),
            scheduledAt: MoreThanOrEqual(now),
          },
          relations: { room: { property: true } },
          order: { scheduledAt: 'ASC' },
          take: 4,
        }),
        this.roommateRequests.find({
          where: {
            recipientId: user.id,
            status: RoommateRequestStatus.PENDING,
          },
          relations: { sender: true },
          order: { createdAt: 'DESC' },
          take: 4,
        }),
        this.countStudentUnpaidInvoices(user.id),
      ]);

    return {
      summary: {
        recommendations: recommendations.meta.total,
        favorites: favoriteCount,
        appointments: appointments.length,
        unpaidInvoices,
      },
      recommendations: recommendations.data,
      upcomingAppointments: { items: appointments.map(presentAppointment) },
      roommateRequests: {
        items: roommateRequests.map((request) => ({
          id: request.id,
          senderId: request.senderId,
          recipientId: request.recipientId,
          postId: request.postId,
          roomId: request.roomId,
          message: request.message,
          status: request.status,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          sender: request.sender
            ? presentPublicUserSummary(request.sender)
            : null,
        })),
      },
    };
  }

  async landlord(user: AuthenticatedUser) {
    const propertyWhere = { property: { landlordId: user.id } };
    const [
      totalRooms,
      availableRooms,
      rentedRooms,
      pendingAppointments,
      unpaidInvoices,
      recentRooms,
      appointments,
    ] = await Promise.all([
      this.rooms.count({ where: propertyWhere }),
      this.rooms.count({
        where: {
          ...propertyWhere,
          status: RoomStatus.AVAILABLE,
          availableSlots: MoreThan(0),
        },
      }),
      this.rooms.count({
        where: { ...propertyWhere, status: RoomStatus.RENTED },
      }),
      this.appointments.count({
        where: {
          landlordId: user.id,
          status: ViewingAppointmentStatus.PENDING,
        },
      }),
      this.countLandlordUnpaidInvoices(user.id),
      this.rooms.find({
        where: propertyWhere,
        relations: {
          property: { landlord: true },
          images: true,
          amenities: { amenity: true },
          reviews: true,
        },
        order: { updatedAt: 'DESC' },
        take: 6,
      }),
      this.appointments.find({
        where: {
          landlordId: user.id,
          status: In([
            ViewingAppointmentStatus.PENDING,
            ViewingAppointmentStatus.ACCEPTED,
            ViewingAppointmentStatus.RESCHEDULED,
          ]),
        },
        relations: { room: { property: true }, student: true },
        order: { scheduledAt: 'ASC' },
        take: 5,
      }),
    ]);

    return {
      summary: {
        totalRooms,
        availableRooms,
        rentedRooms,
        pendingAppointments,
        unpaidInvoices,
      },
      recentRooms: { items: recentRooms.map(presentRoomList) },
      upcomingAppointments: { items: appointments.map(presentAppointment) },
    };
  }

  async admin(_user: AuthenticatedUser) {
    const [
      users,
      rooms,
      properties,
      pendingVerifications,
      pendingReports,
      activeContracts,
      unpaidInvoices,
      recentUsers,
      recentReports,
    ] = await Promise.all([
      this.users.count(),
      this.rooms.count(),
      this.properties.count(),
      this.verificationRequests.count({
        where: { status: VerificationStatus.PENDING },
      }),
      this.reports.count({
        where: { status: In([ReportStatus.PENDING, ReportStatus.PROCESSING]) },
      }),
      this.contracts.count({ where: { status: ContractStatus.ACTIVE } }),
      this.invoices.count({
        where: { status: In([InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE]) },
      }),
      this.users.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.reports.find({
        relations: { reporter: true },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      counts: {
        users,
        rooms,
        properties,
        pendingVerifications,
        pendingReports,
        activeContracts,
        unpaidInvoices,
      },
      recentUsers: recentUsers.map(presentPublicUserSummary),
      recentReports: recentReports.map((report) => ({
        id: report.id,
        targetType: report.targetType,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        reporter: report.reporter
          ? presentPublicUserSummary(report.reporter)
          : null,
      })),
    };
  }

  private async countStudentUnpaidInvoices(studentId: number): Promise<number> {
    return this.invoices
      .createQueryBuilder('invoice')
      .innerJoin('invoice.contract', 'contract')
      .innerJoin('contract.tenants', 'tenant')
      .where('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE],
      })
      .andWhere('tenant.studentId = :studentId', { studentId })
      .getCount();
  }

  private async countLandlordUnpaidInvoices(
    landlordId: number,
  ): Promise<number> {
    return this.invoices
      .createQueryBuilder('invoice')
      .innerJoin('invoice.contract', 'contract')
      .where('invoice.status IN (:...statuses)', {
        statuses: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE],
      })
      .andWhere('contract.landlordId = :landlordId', { landlordId })
      .getCount();
  }
}

function presentAppointment(appointment: ViewingAppointment) {
  return {
    id: appointment.id,
    roomId: appointment.roomId,
    studentId: appointment.studentId,
    landlordId: appointment.landlordId,
    scheduledAt: appointment.scheduledAt,
    proposedAt: appointment.proposedAt,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    room: appointment.room
      ? {
          id: appointment.room.id,
          name: appointment.room.name,
          code: appointment.room.code,
          property: appointment.room.property
            ? {
                id: appointment.room.property.id,
                name: appointment.room.property.name,
                address: appointment.room.property.address,
              }
            : null,
        }
      : null,
    student: appointment.student
      ? presentPublicUserSummary(appointment.student)
      : null,
  };
}
