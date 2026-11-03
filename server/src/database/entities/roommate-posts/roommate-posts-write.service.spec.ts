import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Room, RoommatePost } from '../../database/entities';
import { RoommatePostStatus, UserRole, UserStatus } from '../../database/enums/domain.enums';
import { AuthenticatedUser } from '../auth/auth.types';
import { RoommatePostsService } from './roommate-posts.service';

const student: AuthenticatedUser = { id: 7, username: 'student', email: 'student@example.test', fullName: 'Sinh viên A', role: UserRole.STUDENT, status: UserStatus.ACTIVE };

function post(studentId = student.id): RoommatePost {
  return {
    id: 15, studentId, roomId: 5, title: 'Tìm bạn ở ghép', content: 'Cần tìm một bạn cùng thuê phòng.', area: 'Quận 1',
    budgetPerPerson: '2500000.00', neededPeople: 1, preferredGender: null, moveInDate: null, requirements: null,
    status: RoommatePostStatus.OPEN, createdAt: new Date('2026-01-01T00:00:00.000Z'), updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as RoommatePost;
}

describe('RoommatePostsService write operations', () => {
  const rooms = { findOne: jest.fn() };
  const posts = { create: jest.fn(), findOne: jest.fn(), save: jest.fn(), update: jest.fn() };
  let service: RoommatePostsService;

  beforeEach(() => {
    jest.resetAllMocks();
    posts.create.mockImplementation((value: unknown) => value);
    const map = new Map<unknown, unknown>([[Room, rooms], [RoommatePost, posts]]);
    const manager = { getRepository: jest.fn((entity: unknown) => map.get(entity)) };
    const transaction = jest.fn(async (work: (value: typeof manager) => Promise<unknown>) => work(manager));
    service = new RoommatePostsService(posts as unknown as Repository<RoommatePost>, { transaction } as unknown as DataSource);
  });

  it('creates a post for the authenticated student rather than a client-provided owner', async () => {
    rooms.findOne.mockResolvedValue({ id: 5, status: 'AVAILABLE' });
    posts.save.mockResolvedValue({ id: 15 });
    posts.findOne.mockResolvedValue(post());

    await service.create(student, { roomId: 5, title: 'Tìm bạn ở ghép', content: 'Cần tìm một bạn cùng thuê phòng.', area: 'Quận 1', budgetPerPerson: 2_500_000, neededPeople: 1 });

    expect(posts.create).toHaveBeenCalledWith(expect.objectContaining({ studentId: student.id, roomId: 5, status: RoommatePostStatus.OPEN }));
    expect(rooms.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_read' } }));
  });

  it('rejects a post that refers to a hidden room', async () => {
    rooms.findOne.mockResolvedValue({ id: 5, status: 'HIDDEN' });

    await expect(service.create(student, { roomId: 5, title: 'Tìm bạn ở ghép', content: 'Cần tìm một bạn cùng thuê phòng.', budgetPerPerson: 2_500_000, neededPeople: 1 }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(posts.save).not.toHaveBeenCalled();
  });

  it('does not let another student edit a post', async () => {
    posts.findOne.mockResolvedValue(post(99));

    await expect(service.update(student, 15, { title: 'Sửa hộ bài đăng' }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(posts.update).not.toHaveBeenCalled();
  });

  it('archives a post instead of deleting its history', async () => {
    posts.findOne.mockResolvedValue(post());
    posts.update.mockResolvedValue({ affected: 1 });

    await expect(service.archive(student, 15)).resolves.toEqual({ id: 15, status: RoommatePostStatus.ARCHIVED });
    expect(posts.update).toHaveBeenCalledWith({ id: 15 }, { status: RoommatePostStatus.ARCHIVED });
  });
});
