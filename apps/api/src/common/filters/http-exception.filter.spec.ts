import { ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from './http-exception.filter';

function mockHost(url = '/api/test') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('formats HttpException with string response', () => {
    const { host, status, json } = mockHost();
    filter.catch(new BadRequestException('bad'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'bad',
        },
        meta: expect.objectContaining({
          path: '/api/test',
        }),
      }),
    );
  });

  it('formats validation array messages', () => {
    const { host, status, json } = mockHost();
    const ex = new HttpException(
      { message: ['email must be email', 'name required'], statusCode: 400 },
      400,
    );
    filter.catch(ex, host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu đầu vào không hợp lệ.',
          details: ['email must be email', 'name required'],
        },
      }),
    );
  });

  it('returns INTERNAL_SERVER_ERROR format for unknown errors', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.',
        },
      }),
    );
  });

  it('masks InternalServerErrorException messages', () => {
    const { host, status, json } = mockHost();
    const ex = new HttpException('Sensitive DB connection failed', 500);
    filter.catch(ex, host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.',
        },
      }),
    );
  });

  it('formats Prisma P2002 conflict error', () => {
    const { host, status, json } = mockHost();
    const ex = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: { target: ['email'] },
      message: 'Unique constraint failed on the fields: (`email`)',
    };
    Object.setPrototypeOf(ex, Prisma.PrismaClientKnownRequestError.prototype);
    filter.catch(ex, host);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'CONFLICT_ERROR',
          message: 'Dữ liệu này đã tồn tại trong hệ thống.',
          details: ['email'],
        },
      }),
    );
  });

  it('formats Prisma P2025 not found error', () => {
    const { host, status, json } = mockHost();
    const ex = {
      name: 'PrismaClientKnownRequestError',
      code: 'P2025',
      message: 'An operation failed because it depends on one or more records that were required but not found',
    };
    Object.setPrototypeOf(ex, Prisma.PrismaClientKnownRequestError.prototype);
    filter.catch(ex, host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Không tìm thấy dữ liệu yêu cầu.',
        },
      }),
    );
  });
});
