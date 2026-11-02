import { UserRole, UserStatus, ViewingAppointmentStatus } from '../../database/enums/domain.enums';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

const student = {
  id: 7,
  username: 'student-7',
  email: 'private@example.com',
  fullName: 'Sinh viên',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

describe('AppointmentsController', () => {
  it('returns the existing collection envelope for the list screen', async () => {
    const result = {
      data: { items: [{ id: 42, room: { name: 'Phòng 101' } }] },
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    const appointmentsService = { list: jest.fn().mockResolvedValue(result) };
    const controller = new AppointmentsController(
      appointmentsService as unknown as AppointmentsService,
    );

    await expect(controller.list(student, { page: 1, limit: 50 })).resolves.toEqual({
      success: true,
      message: 'Thành công',
      ...result,
    });
  });

  it('routes legacy PATCH cancellation to the student-owned cancel operation', async () => {
    const appointmentsService = {
      cancel: jest.fn().mockResolvedValue({ id: 42, status: 'CANCELLED' }),
    };
    const controller = new AppointmentsController(
      appointmentsService as unknown as AppointmentsService,
    );

    const response = await controller.updateLegacy(student, 42, {
      status: ViewingAppointmentStatus.CANCELLED,
    });

    expect(appointmentsService.cancel).toHaveBeenCalledWith(student, 42);
    expect(response).toEqual(
      expect.objectContaining({ message: 'Đã hủy lịch xem' }),
    );
  });
});
