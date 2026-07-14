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

  it('fetchDistricts maps 404 to NotFoundException', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
    });
    await expect(service.fetchDistricts('999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('fetchWards returns wards array from payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ wards: [{ code: 'w1' }] }),
    });
    const result = await service.fetchWards('d1');
    expect(result).toEqual([{ code: 'w1' }]);
  });
});
