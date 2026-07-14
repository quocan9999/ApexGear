import { ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
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
        statusCode: 400,
        message: 'bad',
        path: '/api/test',
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
        message: 'Validation failed',
        errors: ['email must be email', 'name required'],
      }),
    );
  });

  it('passes through remaining_attempts extra fields', () => {
    const { host, json } = mockHost();
    const ex = new HttpException(
      { message: 'Invalid credentials', remaining_attempts: 3 },
      401,
    );
    filter.catch(ex, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid credentials',
        remaining_attempts: 3,
      }),
    );
  });

  it('returns 500 for unknown errors', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
    );
  });
});
