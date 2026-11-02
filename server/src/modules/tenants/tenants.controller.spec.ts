import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

const landlord = {
  id: 9,
  username: 'landlord-9',
  email: 'private@example.com',
  fullName: 'Chủ trọ',
  role: UserRole.LANDLORD,
  status: UserStatus.ACTIVE,
};

describe('TenantsController', () => {
  it('returns the established collection envelope', async () => {
    const result = {
      data: { items: [{ id: 71, room: { name: 'Phòng 101' } }] },
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    const tenantsService = { list: jest.fn().mockResolvedValue(result) };
    const controller = new TenantsController(
      tenantsService as unknown as TenantsService,
    );

    await expect(
      controller.list(landlord, { candidates: false, page: 1, limit: 50 }),
    ).resolves.toEqual({
      success: true,
      message: 'Thành công',
      ...result,
    });
  });
});
