import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { inventoryService } from './inventory.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const item: import('../types').InventoryItem = {
  id: 'v1',
  sku: 'WH-1000XM5-BLK',
  name: 'Sony WH-1000XM5 (Đen)',
  stockTotal: 50,
  stockAvailable: 45,
  lowStockThreshold: 10,
  product: { id: 'p1', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5' },
};

describe('inventoryService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('list hits /inventory with params and keeps meta', async () => {
    const payload = {
      data: [item],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await inventoryService.list({ page: 1, search: 'Sony' });

    expect(api.get).toHaveBeenCalledWith('/inventory', {
      params: { page: 1, search: 'Sony' },
    });
    expect(result).toEqual(payload);
  });

  it('lowStock hits /inventory/low-stock with meta', async () => {
    const payload = {
      data: [item],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await inventoryService.lowStock({ page: 1 });

    expect(api.get).toHaveBeenCalledWith('/inventory/low-stock', {
      params: { page: 1 },
    });
    expect(result).toEqual(payload);
  });

  it('outOfStock hits /inventory/out-of-stock with meta', async () => {
    const payload = {
      data: [item],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await inventoryService.outOfStock({ page: 1 });
    expect(api.get).toHaveBeenCalledWith('/inventory/out-of-stock', {
      params: { page: 1 },
    });
    expect(result).toEqual(payload);
  });

  it('adjust stock unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: item } });
    const result = await inventoryService.adjust('v1', 10);
    expect(api.patch).toHaveBeenCalledWith('/inventory/variants/v1/adjust', {
      adjustment: 10,
    });
    expect(result).toEqual(item);
  });
});
