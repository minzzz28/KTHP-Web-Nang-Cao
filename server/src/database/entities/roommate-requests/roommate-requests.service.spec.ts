import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import {
  Notification,
  Room,
  RoommatePost,
  RoommateRequest,
  User,
} from '../../database/entities';
import {
  NotificationType,
  RoommateRequestStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';
import { RoommateRequestAction } from './dto/respond-roommate-request.dto';
import { RoommateRequestsService } from './roommate-requests.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-02T00:00:00.000Z');

function createUser(id: number, fullName = `Sinh viên ${id}`): User {
  return {
    id,
    username: `student-${id}`,
    email: `private-${id}@example.com`,
    passwordHash: 'private-password-hash',
    fullName,
    phone: '0900000000',
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    verificationStatus: VerificationStatus.VERIFIED,
    createdAt,
    updatedAt,
  } as User;
}

function createRequest(
  overrides: Partial<RoommateRequest> = {},
): RoommateRequest {
  return {
    id: 15,
    senderId: 7,
    recipientId: 8,
    postId: null,
    roomId: null,
    message: 'Mình muốn trao đổi thêm về việc ở ghép.',
    status: RoommateRequestStatus.PENDING,
    activePairKey: '7:8',
    respondedAt: null,
    createdAt,
    updatedAt,
    sender: createUser(7, 'Người gửi'),
    recipient: createUser(8, 'Người nhận'),
    post: null,
    room: null,
    ...overrides,
  } as RoommateRequest;
}

describe('RoommateRequestsService', () => {
  const listRepository = { findAndCount: jest.fn() };
  const users = { findOneBy: jest.fn() };
  const posts = { findOneBy: jest.fn() };
  const rooms = { findOneBy: jest.fn() };
  const requests = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const notifications = { create: jest.fn(), save: jest.fn() };
  let transaction: jest.Mock;
  let service: RoommateRequestsService;

  beforeEach(() => {
    jest.resetAllMocks();
    requests.create.mockImplementation((input: unknown) => input);
    notifications.create.mockImplementation((input: unknown) => input);

    const repositories = new Map<unknown, unknown>([
      [User, users],
      [RoommatePost, posts],
      [Room, rooms],
      [RoommateRequest, requests],
      [Notification, notifications],
    ]);
    const manager = {
      getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    };
    transaction = jest.fn(
      async (work: (transactionalManager: typeof manager) => Promise<unknown>) =>
        work(manager),
    );
    service = new RoommateRequestsService(
      listRepository as unknown as Repository<RoommateRequest>,
      { transaction } as unknown as DataSource,
    );
  });

  it('only queries sent requests belonging to the authenticated student', async () => {
    listRepository.findAndCount.mockResolvedValue([[createRequest()], 1]);

    const result = await service.listSent(7, { page: 1, limit: 100 });

    expect(listRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { senderId: 7 }, take: 100 }),
    );
    expect(result.data.items[0].sender?.user).not.toHaveProperty('email');
    expect(result.data.items[0].sender?.user).not.toHaveProperty('phone');
    expect(result.data.items[0].sender?.user).not.toHaveProperty('passwordHash');
  });

  it('rejects a self-invitation before opening a database transaction', async () => {
    await expect(
      service.send({ id: 7, fullName: 'Người gửi' }, { recipientId: 7 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('trims the optional message before it reaches persistence', async () => {
    const input = plainToInstance(CreateRoommateRequestDto, {
      recipientId: '8',
      message: '  Mình muốn trao đổi thêm.  ',
    });

    expect(await validate(input)).toHaveLength(0);
    expect(input.message).toBe('Mình muốn trao đổi thêm.');
  });

  it('rejects a missing or ineligible recipient before creating a request', async () => {
    users.findOneBy.mockResolvedValue(null);

    await expect(
      service.send({ id: 7, fullName: 'Người gửi' }, { recipientId: 8 }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(requests.create).not.toHaveBeenCalled();
    expect(requests.save).not.toHaveBeenCalled();
  });

  it('maps the active-pair unique constraint to a conflict response', async () => {
    users.findOneBy.mockResolvedValue(createUser(8));
    requests.save.mockRejectedValue({ code: 'ER_DUP_ENTRY', errno: 1062 });

    await expect(
      service.send({ id: 7, fullName: 'Người gửi' }, { recipientId: 8 }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('does not reveal a request to a student outside its pair', async () => {
    requests.findOne.mockResolvedValue(createRequest());

    await expect(
      service.respond(
        { id: 9, fullName: 'Người ngoài cuộc' },
        15,
        RoommateRequestAction.ACCEPT,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(requests.update).not.toHaveBeenCalled();
    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('does not allow the sender to accept their own invitation', async () => {
    requests.findOne.mockResolvedValue(createRequest());

    await expect(
      service.respond(
        { id: 7, fullName: 'Người gửi' },
        15,
        RoommateRequestAction.ACCEPT,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(requests.update).not.toHaveBeenCalled();
  });

  it('does not send a notification when a concurrent response wins the update', async () => {
    requests.findOne.mockResolvedValue(createRequest());
    requests.update.mockResolvedValue({ affected: 0 });

    await expect(
      service.respond(
        { id: 8, fullName: 'Người nhận' },
        15,
        RoommateRequestAction.REJECT,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(notifications.save).not.toHaveBeenCalled();
  });

  it('accepts once with an owner-and-status conditional update, then notifies the sender', async () => {
    const pending = createRequest();
    const accepted = createRequest({
      status: RoommateRequestStatus.ACCEPTED,
      activePairKey: null,
      respondedAt: updatedAt,
    });
    requests.findOne
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(accepted);
    requests.update.mockResolvedValue({ affected: 1 });
    notifications.save.mockResolvedValue({ id: 1 });

    const result = await service.respond(
      { id: 8, fullName: 'Người nhận' },
      15,
      RoommateRequestAction.ACCEPT,
    );

    expect(requests.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 15,
        recipientId: 8,
        status: RoommateRequestStatus.PENDING,
      }),
      expect.objectContaining({
        status: RoommateRequestStatus.ACCEPTED,
        activePairKey: null,
        respondedAt: expect.any(Date),
      }),
    );
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        type: NotificationType.ROOMMATE_REQUEST_RESPONSE,
      }),
    );
    expect(result.status).toBe(RoommateRequestStatus.ACCEPTED);
    expect(result.sender?.user).not.toHaveProperty('email');
  });
});
