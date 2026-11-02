import { InvoiceStatus, UserRole, UserStatus } from '../../database/enums/domain.enums';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

const landlord = {
  id: 9,
  username: 'landlord-9',
  email: 'private@example.com',
  fullName: 'Chủ trọ',
  role: UserRole.LANDLORD,
  status: UserStatus.ACTIVE,
};

describe('InvoicesController', () => {
  it('returns the established list envelope', async () => {
    const result = {
      data: { items: [{ id: 101, contract: { room: { name: 'Phòng 101' } } }] },
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    const invoicesService = { list: jest.fn().mockResolvedValue(result) };
    const controller = new InvoicesController(
      invoicesService as unknown as InvoicesService,
    );

    await expect(controller.list(landlord, { page: 1, limit: 50 })).resolves.toEqual({
      success: true,
      message: 'Thành công',
      ...result,
    });
  });

  it('keeps the existing PATCH endpoint for invoice status updates', async () => {
    const invoicesService = {
      updateStatus: jest
        .fn()
        .mockResolvedValue({ id: 101, status: InvoiceStatus.PAID }),
    };
    const controller = new InvoicesController(
      invoicesService as unknown as InvoicesService,
    );

    const response = await controller.updateStatus(landlord, 101, {
      status: InvoiceStatus.PAID,
    });

    expect(invoicesService.updateStatus).toHaveBeenCalledWith(landlord, 101, {
      status: InvoiceStatus.PAID,
    });
    expect(response).toEqual(
      expect.objectContaining({ message: 'Đã cập nhật hóa đơn' }),
    );
  });
});
