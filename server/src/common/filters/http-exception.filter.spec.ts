import {
  ArgumentsHost,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  const request = { url: '/api/universities/404' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.resetAllMocks();
    response.status.mockReturnValue(response);
  });

  it('keeps expected HTTP errors in the public response envelope', () => {
    new HttpExceptionFilter().catch(
      new NotFoundException('Không tìm thấy trường đại học'),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Không tìm thấy trường đại học',
        path: '/api/universities/404',
      }),
    );
  });

  it('does not reveal unknown internal errors', () => {
    new HttpExceptionFilter().catch(new Error('database credential leaked'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Đã xảy ra lỗi máy chủ',
      }),
    );
  });

  it('keeps field-level validation errors for compatible 422 responses', () => {
    new HttpExceptionFilter().catch(
      new UnprocessableEntityException({
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: [{ field: 'email', message: 'Email không hợp lệ' }],
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Dữ liệu gửi lên không hợp lệ',
        errors: [{ field: 'email', message: 'Email không hợp lệ' }],
      }),
    );
  });
});
