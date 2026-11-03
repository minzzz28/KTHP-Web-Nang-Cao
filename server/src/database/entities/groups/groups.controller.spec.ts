import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

const user = {
  id: 7,
  username: 'student-7',
  email: 'private@example.com',
  fullName: 'Sinh viên 7',
  role: UserRole.STUDENT,
  status: UserStatus.ACTIVE,
};

describe('GroupsController', () => {
  it('returns the legacy collection envelope for a student\'s own groups', async () => {
    const result = {
      data: { items: [{ id: 42, name: 'Nhóm Mẫu' }] },
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    const groupsService = { mine: jest.fn().mockResolvedValue(result) };
    const controller = new GroupsController(
      groupsService as unknown as GroupsService,
    );

    const response = await controller.mine(user, { page: 1, limit: 50 });

    expect(groupsService.mine).toHaveBeenCalledWith(7, {
      page: 1,
      limit: 50,
    });
    expect(response).toEqual({ success: true, message: 'Thành công', ...result });
  });

  it('uses the authenticated actor rather than request body data when adding a member', async () => {
    const groupsService = {
      addMember: jest.fn().mockResolvedValue({ id: 108, studentId: 8 }),
    };
    const controller = new GroupsController(
      groupsService as unknown as GroupsService,
    );

    const response = await controller.addMember(user, 42, { studentId: 8 });

    expect(groupsService.addMember).toHaveBeenCalledWith(user, 42, 8);
    expect(response).toEqual(
      expect.objectContaining({ success: true, data: { id: 108, studentId: 8 } }),
    );
  });

  it('returns null data after a successful leave without exposing mutation internals', async () => {
    const groupsService = { leave: jest.fn().mockResolvedValue(undefined) };
    const controller = new GroupsController(
      groupsService as unknown as GroupsService,
    );

    await expect(controller.leave(user, 42)).resolves.toEqual({
      success: true,
      message: 'Đã rời nhóm thuê trọ',
      data: null,
    });
    expect(groupsService.leave).toHaveBeenCalledWith(7, 42);
  });
});
