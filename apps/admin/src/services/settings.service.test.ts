import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { settingsService } from './settings.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('settingsService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('list hits /settings and unwraps data array', async () => {
    const settings = [
      { id: 's1', key: 'store_name', value: 'ApexGear' },
      { id: 's2', key: 'shipping_fee', value: '30000' },
    ];
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: settings } });

    const result = await settingsService.list();

    expect(api.get).toHaveBeenCalledWith('/settings');
    expect(result).toEqual(settings);
  });

  it('update sends PATCH /settings/:key with value and unwraps data', async () => {
    const updated = { id: 's1', key: 'store_name', value: 'ApexGear Pro' };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: updated } });

    const result = await settingsService.update('store_name', 'ApexGear Pro');

    expect(api.patch).toHaveBeenCalledWith('/settings/store_name', { value: 'ApexGear Pro' });
    expect(result).toEqual(updated);
  });
});
