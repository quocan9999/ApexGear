import { of, lastValueFrom } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();
  const context = {} as ExecutionContext;

  it('wraps plain responses in { data, meta }', async () => {
    const next: CallHandler = { handle: () => of({ id: 1 }) };
    const result = await lastValueFrom(interceptor.intercept(context, next));
    expect(result.data).toEqual({ id: 1 });
    expect(result.meta).toEqual(
      expect.objectContaining({ timestamp: expect.any(String) }),
    );
  });

  it('passes through paginated { data, meta } and adds timestamp', async () => {
    const next: CallHandler = {
      handle: () =>
        of({
          data: [1, 2],
          meta: { page: 1, total: 2 },
        }),
    };
    const result = await lastValueFrom(interceptor.intercept(context, next));
    expect(result.data).toEqual([1, 2]);
    expect(result.meta).toEqual(
      expect.objectContaining({
        page: 1,
        total: 2,
        timestamp: expect.any(String),
      }),
    );
  });
});
