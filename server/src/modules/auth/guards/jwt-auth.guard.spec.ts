import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/identity/user.entity';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../../database/enums/domain.enums';
import { JwtAuthGuard } from './jwt-auth.guard';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    username: 'sinhvien',
    email: 'sv@example.com',
    passwordHash: 'not-returned',
    fullName: 'Sinh viên A',
    phone: null,
    avatarUrl: null,
    role: UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    verificationStatus: VerificationStatus.UNVERIFIED,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as User;
}

function contextFor(request: {
  headers: { authorization?: string };
  cookies?: Record<string, string>;
  session?: { userId?: number };
  user?: unknown;
}) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const users = { findOneBy: jest.fn() };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      users as unknown as Repository<User>,
    );
  });

  it('rejects a missing Bearer token', async () => {
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('verifies HS256 and uses the fresh database role rather than the token claim', async () => {
    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer signed-token' },
    };
    jwtService.verifyAsync.mockResolvedValue({ sub: '7', role: UserRole.ADMIN });
    users.findOneBy.mockResolvedValue(createUser({ role: UserRole.STUDENT }));

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('signed-token', {
      algorithms: ['HS256'],
    });
    expect(request.user).toEqual(
      expect.objectContaining({ id: 7, role: UserRole.STUDENT }),
    );
  });

  it('accepts a JWT from the HttpOnly cookie only when it belongs to the active session', async () => {
    const request = {
      headers: {},
      cookies: { student_rental_access: 'cookie-token' },
      session: { userId: 7 },
    };
    jwtService.verifyAsync.mockResolvedValue({ sub: '7', role: UserRole.STUDENT });
    users.findOneBy.mockResolvedValue(createUser());

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie-token', {
      algorithms: ['HS256'],
    });
  });

  it('rejects a cookie JWT when its server session does not belong to that account', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: '7', role: UserRole.STUDENT });
    users.findOneBy.mockResolvedValue(createUser());

    await expect(
      guard.canActivate(
        contextFor({
          headers: {},
          cookies: { student_rental_access: 'cookie-token' },
          session: { userId: 8 },
        }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a disabled account even when its token verifies', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: '7', role: UserRole.STUDENT });
    users.findOneBy.mockResolvedValue(createUser({ status: UserStatus.DISABLED }));

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer signed-token' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
