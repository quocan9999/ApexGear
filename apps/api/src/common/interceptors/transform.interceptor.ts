import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Recursively convert Prisma.Decimal values to plain numbers.
 *
 * Prisma's Decimal (backed by decimal.js) has no toJSON in this version, so
 * JSON.stringify emits its internal shape ({ s, e, d }) instead of a number.
 * That reaches the client as an unusable object and formatPrice renders "—".
 * The client price contract is `number`, so we coerce here — VND prices are
 * whole numbers well within Number's safe range.
 */
function serializeDecimals(value: unknown): unknown {
  if (value == null) return value;
  if (Prisma.Decimal.isDecimal(value)) {
    return (value as Prisma.Decimal).toNumber();
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(serializeDecimals);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = serializeDecimals(v);
    return out;
  }
  return value;
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
            data: serializeDecimals(responseData.data) as T,
            meta: {
              ...responseData.meta,
              timestamp: new Date().toISOString(),
            },
          };
        }
        // Wrap plain response in { data }
        return {
          data: serializeDecimals(responseData) as T,
          meta: { timestamp: new Date().toISOString() },
        };
      }),
    );
  }
}
