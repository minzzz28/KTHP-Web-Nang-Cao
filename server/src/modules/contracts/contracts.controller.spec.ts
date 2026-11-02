import { UserRole, UserStatus, ContractStatus } from '../../database/enums/domain.enums';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

const landlord = {
  id: 9,
  username: 'landlord-9',
  email: 'private@example.com',
  fullName: 'Chủ trọ',
  role: UserRole.LANDLORD,
  status: UserStatus.ACTIVE,
};

describe('ContractsController', () => {
  it('returns the established list envelope', async () => {
    const result = {
      data: { items: [{ id: 42, room: { name: 'Phòng 101' } }] },
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    const contractsService = { list: jest.fn().mockResolvedValue(result) };
    const controller = new ContractsController(
      contractsService as unknown as ContractsService,
    );

    await expect(controller.list(landlord, { page: 1, limit: 50 })).resolves.toEqual({
      success: true,
      message: 'Thành công',
      ...result,
    });
  });

  it('keeps both transition routes on the same protected operation', async () => {
    const contractsService = {
      transition: jest
        .fn()
        .mockResolvedValue({ id: 42, status: ContractStatus.ACTIVE }),
    };
    const controller = new ContractsController(
      contractsService as unknown as ContractsService,
    );

    const response = await controller.transitionLegacy(landlord, 42, {
      status: ContractStatus.ACTIVE,
    });

    expect(contractsService.transition).toHaveBeenCalledWith(landlord, 42, {
      status: ContractStatus.ACTIVE,
    });
    expect(response).toEqual(
      expect.objectContaining({ message: 'Đã cập nhật trạng thái hợp đồng' }),
    );
  });
});
