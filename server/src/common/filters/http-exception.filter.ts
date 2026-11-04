import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ExceptionResponse = {
  message?: string | string[];
  errors?: Array<{ field: string; message: string }>;
};

function messageFrom(exception: HttpException): string {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  const message = (response as ExceptionResponse).message;
  return Array.isArray(message) ? message.join(', ') : message ?? exception.message;
}

function validationErrorsFrom(
  exception: HttpException,
): Array<{ field: string; message: string }> | undefined {
  const response = exception.getResponse();
  if (typeof response === 'string') return undefined;

  const errors = (response as ExceptionResponse).errors;
  return Array.isArray(errors) ? errors : undefined;
}

/**
 * Keeps NestJS errors compatible with the existing `{ success, message }`
 * response envelope and never exposes unknown server-error details to clients.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException
      ? messageFrom(exception)
      : 'Đã xảy ra lỗi máy chủ';

    const payload: {
      success: false;
      message: string;
      path: string;
      timestamp: string;
      errors?: Array<{ field: string; message: string }>;
    } = {
      success: false,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (isHttpException) {
      const validationErrors = validationErrorsFrom(exception);
      if (validationErrors?.length) payload.errors = validationErrors;
    }

    response.status(status).json(payload);
  }
}
