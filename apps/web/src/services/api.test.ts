import { describe, expect, it } from 'vitest';
import api from './api';

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
    const rejected = api.interceptors.response.handlers.find((h) => h?.rejected)?.rejected;
    expect(rejected).toBeTypeOf('function');

    const normalized = await rejected!({
      response: { data: { message: 'Không tìm thấy' }, status: 404 },
    }).catch((e: unknown) => e);

    expect(normalized).toEqual({ message: 'Không tìm thấy', status: 404 });
  });

  it('falls back to a generic message when none is provided', async () => {
    const rejected = api.interceptors.response.handlers.find((h) => h?.rejected)?.rejected;
    const normalized = await rejected!({}).catch((e: unknown) => e);
    expect(normalized).toEqual({ message: 'Something went wrong', status: undefined });
  });
});
