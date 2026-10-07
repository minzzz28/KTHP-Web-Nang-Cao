import { ForbiddenException } from '@nestjs/common';
import { csrfSync } from 'csrf-sync';
import type { RequestHandler } from 'express';

const {
  csrfSynchronisedProtection,
  generateToken,
} = csrfSync({
  errorConfig: {
    statusCode: 403,
    code: 'EBADCSRFTOKEN',
    message: 'Yêu cầu không có mã bảo vệ CSRF hợp lệ.',
  },
});

/**
 * Converts the Express-specific CSRF error into a Nest exception so the global
 * error filter returns the normal API envelope without exposing internals.
 */
export const csrfProtection: RequestHandler = (request, response, next) => {
  csrfSynchronisedProtection(request, response, (error?: unknown) => {
    if (error) {
      next(new ForbiddenException('Yêu cầu không có mã bảo vệ CSRF hợp lệ.'));
      return;
    }
    next();
  });
};

export function createCsrfToken(request: Parameters<typeof generateToken>[0]): string {
  return generateToken(request);
}
