import { createHmac } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, RequestHandler, Response } from 'express';
import session from 'express-session';
import mysqlSession from 'express-mysql-session';

export const ACCESS_TOKEN_COOKIE = 'student_rental_access';
export const SESSION_COOKIE = 'student_rental_session';

export type SessionStore = session.Store & {
  onReady(): Promise<void>;
};

const FALLBACK_SESSION_SECRET_LABEL = 'student-rental/express-session/v1';
const DEFAULT_SESSION_DURATION = '7d';
const DURATION_PATTERN = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)$/i;
const DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
  y: 31_536_000_000,
};

function isProduction(configService: ConfigService): boolean {
  return configService.get<string>('NODE_ENV') === 'production';
}

function parseDuration(value: string): number {
  const match = DURATION_PATTERN.exec(value.trim());
  if (!match) {
    throw new Error('JWT_EXPIRES_IN must be a positive duration such as "7d" or "12h".');
  }

  const duration = Number(match[1]) * DURATION_MULTIPLIERS[match[2].toLowerCase()];
  if (!Number.isSafeInteger(duration) || duration < 1) {
    throw new Error('JWT_EXPIRES_IN must resolve to a positive safe duration.');
  }

  return duration;
}

function sessionSecret(configService: ConfigService): string {
  const configuredSecret = configService.get<string>('SESSION_SECRET');
  if (configuredSecret) {
    if (configuredSecret.length < 32) {
      throw new Error('SESSION_SECRET must contain at least 32 characters.');
    }
    return configuredSecret;
  }

  if (isProduction(configService)) {
    throw new Error('SESSION_SECRET must be configured in production.');
  }

  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }

  // Existing development installs have a JWT secret but not a separate session
  // secret yet. Deriving a labelled key avoids a hardcoded secret. Production
  // must provide a separate SESSION_SECRET above.
  return createHmac('sha256', jwtSecret)
    .update(FALLBACK_SESSION_SECRET_LABEL)
    .digest('hex');
}

function sessionDuration(configService: ConfigService): number {
  return parseDuration(
    configService.get<string>('JWT_EXPIRES_IN') ?? DEFAULT_SESSION_DURATION,
  );
}

function databaseOptions(configService: ConfigService) {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  if (!databaseUrl) throw new Error('DATABASE_URL must be configured before starting the API.');

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid MySQL connection URL.');
  }

  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  const port = parsed.port ? Number(parsed.port) : 3306;
  if (
    parsed.protocol !== 'mysql:' ||
    !parsed.hostname ||
    !database ||
    !Number.isSafeInteger(port) ||
    port < 1 ||
    port > 65_535
  ) {
    throw new Error('DATABASE_URL must include a valid MySQL host, port and database.');
  }

  return {
    host: parsed.hostname,
    port,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

export function authCookieOptions(configService: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProduction(configService),
    maxAge: sessionDuration(configService),
  };
}

function sessionCookieOptions(configService: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isProduction(configService),
    maxAge: sessionDuration(configService),
  };
}

export function createSessionStore(configService: ConfigService): SessionStore {
  const MySQLStore = mysqlSession(session);
  return new MySQLStore({
    ...databaseOptions(configService),
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1_000,
    expiration: sessionDuration(configService),
    // This table belongs solely to HTTP sessions. It is additive and is not a
    // TypeORM schema synchronization of the existing project database.
    createDatabaseTable: true,
    schema: { tableName: 'app_sessions' },
  }) as SessionStore;
}

export function createSessionMiddleware(
  configService: ConfigService,
  store: SessionStore,
): RequestHandler {
  return session({
    name: SESSION_COOKIE,
    secret: sessionSecret(configService),
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: sessionCookieOptions(configService),
  });
}

export function setAccessTokenCookie(
  response: Response,
  accessToken: string,
  configService: ConfigService,
): void {
  response.cookie(ACCESS_TOKEN_COOKIE, accessToken, authCookieOptions(configService));
}

export function clearAuthenticationCookies(
  response: Response,
  configService: ConfigService,
): void {
  const { maxAge: _maxAge, ...options } = authCookieOptions(configService);
  response.clearCookie(ACCESS_TOKEN_COOKIE, options);
  response.clearCookie(SESSION_COOKIE, options);
}

export function cookieAccessToken(request: Request): string | null {
  const value = request.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function regenerateSession(request: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

export async function destroySession(request: Request): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    request.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}

export function requireSessionUser(request: Request, userId: number): void {
  if (request.session.userId !== userId) {
    throw new BadRequestException('Phiên đăng nhập không khớp với tài khoản.');
  }
}
