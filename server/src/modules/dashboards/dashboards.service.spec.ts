import { Repository } from 'typeorm';
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
import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { RoomsService } from '../rooms/rooms.service';
import { DashboardsService } from './dashboards.service';

describe('DashboardsService', () => {
  it('reads student dashboard data without writing to the database', async () => {
    const roomsService = { list: jest.fn().mockResolvedValue({ data: { items: [] }, meta: { total: 0 } }) };
    const favorites = { count: jest.fn().mockResolvedValue(2) };
    const appointments = { find: jest.fn().mockResolvedValue([]) };
    const requests = { find: jest.fn().mockResolvedValue([]) };
    const invoices = { createQueryBuilder: jest.fn().mockReturnValue({ innerJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(1) }) };
    const emptyRepository = { count: jest.fn(), find: jest.fn() };
    const service = new DashboardsService(
      roomsService as unknown as RoomsService,
      favorites as unknown as Repository<Favorite>,
      appointments as unknown as Repository<ViewingAppointment>,
      requests as unknown as Repository<RoommateRequest>,
      invoices as unknown as Repository<Invoice>,
      emptyRepository as unknown as Repository<Room>,
      emptyRepository as unknown as Repository<Contract>,
      emptyRepository as unknown as Repository<Property>,
      emptyRepository as unknown as Repository<VerificationRequest>,
      emptyRepository as unknown as Repository<Report>,
      emptyRepository as unknown as Repository<User>,
    );

    await expect(
      service.student({
        id: 4,
        username: 'student',
        email: 'student@example.test',
        fullName: 'Sinh viên',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      }),
    ).resolves.toMatchObject({
      summary: { recommendations: 0, favorites: 2, appointments: 0, unpaidInvoices: 1 },
    });
    expect(roomsService.list).toHaveBeenCalledWith({ page: 1, limit: 4, sort: 'NEWEST' });
    expect(favorites).not.toHaveProperty('save');
  });
});
