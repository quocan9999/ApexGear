import { NotFoundException } from '@nestjs/common';
import { ProvincesService } from './provinces.service';

describe('ProvincesService', () => {
  let service: ProvincesService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new ProvincesService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetchProvinces returns API data and caches', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [{ code: '01', name: 'Hà Nội' }],
    });

    const first = await service.fetchProvinces();
    const second = await service.fetchProvinces();

    expect(first).toEqual([{ code: '01', name: 'Hà Nội' }]);
    expect(second).toEqual(first);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('fetchWards maps 404 to NotFoundException', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });
    await expect(service.fetchWards('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('fetchWards returns the wards array from the v2 province payload (depth=2)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1, wards: [{ code: 1, name: 'Phường Ba Đình' }] }),
    });
    const result = await service.fetchWards('1');
    expect(result).toEqual([{ code: 1, name: 'Phường Ba Đình' }]);
  });

  it('fetchWards returns [] (never the raw object) when wards is absent', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1, name: 'Hà Nội' }),
    });
    const result = await service.fetchWards('1');
    expect(result).toEqual([]);
  });
});
