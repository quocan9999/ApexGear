import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errors: unknown[] | undefined;
    let extra: Record<string, unknown> = {};

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const res = exResponse as Record<string, unknown>;
        message = (res.message as string | string[]) || message;
        if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Validation failed';
        }
        if (res.errors) {
          errors = res.errors as unknown[];
        }
        // Pass through extra fields like remaining_attempts, retry_after
        const { message: _m, errors: _e, statusCode: _s, ...rest } = res;
        extra = rest;
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[]) || [];
          message = `Unique constraint violation on: ${target.join(', ')}`;
          break;
        }
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint violation';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          break;
        default:
          this.logger.error(`Prisma error ${exception.code}`, exception.message);
          message = 'Database error';
      }
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...(errors && { errors }),
      ...extra,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
