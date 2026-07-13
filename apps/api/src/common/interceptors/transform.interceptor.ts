import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // If response already has `data` key, pass through (for paginated responses)
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData
        ) {
          return {
            data: responseData.data,
            meta: {
              ...responseData.meta,
              timestamp: new Date().toISOString(),
            },
          };
        }
        // Wrap plain response in { data }
        return {
          data: responseData,
          meta: { timestamp: new Date().toISOString() },
        };
      }),
    );
  }
}
