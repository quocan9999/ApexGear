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
    let code = 'INTERNAL_SERVER_ERROR';
    let message: string | string[] = 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.';
    let details: unknown[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(`Unknown error: ${exception.message}`, exception.stack);
        code = 'INTERNAL_SERVER_ERROR';
        message = 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.';
      } else {
        code = 'HTTP_ERROR';
        const exResponse = exception.getResponse();
        if (typeof exResponse === 'string') {
          message = exResponse;
        } else if (typeof exResponse === 'object' && exResponse !== null) {
          const res = exResponse as Record<string, unknown>;
          message = (res.message as string | string[]) || message;
          if (Array.isArray(res.message)) {
            details = res.message;
            message = 'Dữ liệu đầu vào không hợp lệ.';
            code = 'VALIDATION_ERROR';
          } else if (res.error) {
            code = typeof res.error === 'string' ? res.error.toUpperCase().replace(/\s+/g, '_') : code;
          }
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          code = 'CONFLICT_ERROR';
          const target = exception.meta?.target;
          details = Array.isArray(target) ? target : typeof target === 'string' ? [target] : undefined;
          message = 'Dữ liệu này đã tồn tại trong hệ thống.';
          break;
        }
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          code = 'FOREIGN_KEY_VIOLATION';
          message = 'Dữ liệu ràng buộc không hợp lệ.';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          code = 'NOT_FOUND';
          message = 'Không tìm thấy dữ liệu yêu cầu.';
          break;
        default:
          this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.stack);
          break;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unknown error: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message[0] : message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
