import { describe, expect, it } from 'vitest';
import api from './api';

describe('admin API client', () => {
  it('uses the API proxy and sends httpOnly-cookie credentials', () => {
    expect(api.defaults.baseURL).toBe('/api');
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('normalizes response errors to a message and status object', async () => {
    const originalAdapter = api.defaults.adapter;
    api.defaults.adapter = async () => {
      throw {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };
    };

    try {
      await expect(api.get('/restricted')).rejects.toEqual({
        message: 'Bạn không có quyền thực hiện thao tác này.',
        status: 403,
      });
    } finally {
      api.defaults.adapter = originalAdapter;
    }
  });
});
