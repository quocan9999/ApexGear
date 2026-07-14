import { NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new SettingsService(prisma as never);
  });

  it('get throws when key missing', async () => {
    prisma.setting.findUnique.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update upserts setting', async () => {
    prisma.setting.upsert.mockResolvedValue({
      key: 'shipping_fee',
      value: '40000',
    });
    const result = await service.update('shipping_fee', '40000');
    expect(prisma.setting.upsert).toHaveBeenCalledWith({
      where: { key: 'shipping_fee' },
      update: { value: '40000' },
      create: { key: 'shipping_fee', value: '40000' },
    });
    expect(result.value).toBe('40000');
  });

  it('getPublicSettings returns defaults then overlays DB values', async () => {
    prisma.setting.findMany.mockResolvedValue([
      { key: 'shipping_fee', value: '25000' },
    ]);
    const result = await service.getPublicSettings();
    expect(result).toEqual({
      shipping_fee: '25000',
      store_name: 'ApexGear',
    });
  });
});
