import { describe, expect, it } from 'vitest';
import api from './api';

// axios does not expose interceptor handlers in its public types, so reach into
// the internal array through a narrow local type instead of `any`.
type RejectedFn = (error: unknown) => Promise<unknown>;
function getRejectedHandler(): RejectedFn {
  const manager = api.interceptors.response as unknown as {
    handlers: Array<{ rejected?: RejectedFn } | null>;
  };
  const handler = manager.handlers.find((h) => h?.rejected)?.rejected;
  if (!handler) throw new Error('no rejected response interceptor registered');
  return handler;
}

describe('api instance', () => {
  it('sends credentials with requests', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('sets a JSON content type', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has a base url configured', () => {
    // Falls back to '/api' when VITE_API_URL is unset in the test env.
    expect(api.defaults.baseURL).toBeTruthy();
  });

  it('normalizes rejected responses to { message, status }', async () => {
    const rejected = getRejectedHandler();
    expect(rejected).toBeTypeOf('function');

    const normalized = await rejected({
      response: { data: { message: 'Không tìm thấy' }, status: 404 },
    }).catch((e: unknown) => e);

    expect(normalized).toEqual({ message: 'Không tìm thấy', status: 404 });
  });

  it('falls back to a generic message when none is provided', async () => {
    const rejected = getRejectedHandler();
    const normalized = await rejected({}).catch((e: unknown) => e);
    expect(normalized).toEqual({ message: 'Something went wrong', status: undefined });
  });
});
