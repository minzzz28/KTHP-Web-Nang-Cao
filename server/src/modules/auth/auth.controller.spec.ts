import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UserRole, UserStatus } from '../../database/enums/domain.enums';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

function requestWithSession() {
  const session = {
    regenerate: jest.fn((callback: (error?: Error) => void) => callback()),
    destroy: jest.fn((callback: (error?: Error) => void) => callback()),
  };
  return { session };
}

function authResult() {
  return {
    accessToken: 'signed-token',
    user: {
      id: 7,
      username: 'sinhvien',
      email: 'sv@example.com',
      fullName: 'Sinh viên A',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  };
}

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    changePassword: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => ({ NODE_ENV: 'development', JWT_EXPIRES_IN: '7d' })[key]),
  };
  const response = { cookie: jest.fn(), clearCookie: jest.fn() };
  let controller: AuthController;

  beforeEach(() => {
    jest.resetAllMocks();
    config.get.mockImplementation(
      (key: string) => ({ NODE_ENV: 'development', JWT_EXPIRES_IN: '7d' })[key],
    );
    controller = new AuthController(
      authService as unknown as AuthService,
      config as unknown as ConfigService,
    );
  });

  it('creates a fresh session, stores only the user id, and sets an HttpOnly JWT cookie at login', async () => {
    const request = requestWithSession();
    authService.login.mockResolvedValue(authResult());

    const result = await controller.login(
      { identifier: 'sinhvien', password: 'password' },
      request as unknown as Request,
      response as unknown as Response,
    );

    expect(request.session.regenerate).toHaveBeenCalledTimes(1);
    expect(request.session).toMatchObject({ userId: 7 });
    expect(response.cookie).toHaveBeenCalledWith(
      'student_rental_access',
      'signed-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false }),
    );
    expect(result.data).toEqual(
      expect.objectContaining({
        accessToken: 'signed-token',
        csrfToken: expect.any(String),
      }),
    );
  });

  it('destroys the server session and clears both authentication cookies at logout', async () => {
    const request = requestWithSession();

    await controller.logout(
      request as unknown as Request,
      response as unknown as Response,
    );

    expect(request.session.destroy).toHaveBeenCalledTimes(1);
    expect(response.clearCookie).toHaveBeenCalledWith(
      'student_rental_access',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'student_rental_session',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: false }),
    );
  });
});
