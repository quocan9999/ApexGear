import { Prisma } from '@prisma/client';
import {
  collectDemoSnapshot,
  DEMO_SNAPSHOT_USER_EMAILS,
  restoreDemoSnapshot,
} from './demo-snapshot';

describe('collectDemoSnapshot', () => {
  it('exports only the six base-seed users and every declared model', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      user: { findMany },
      brand: { findMany }, category: { findMany }, coupon: { findMany },
      setting: { findMany }, shippingRule: { findMany }, shippingRegion: { findMany },
      product: { findMany }, productImage: { findMany }, productSpec: { findMany },
      productOptionType: { findMany }, productOptionValue: { findMany },
      productVariant: { findMany }, variantOption: { findMany },
    } as any;

    const snapshot = await collectDemoSnapshot(prisma);

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { email: { in: [...DEMO_SNAPSHOT_USER_EMAILS] } },
      orderBy: { email: 'asc' },
    });
    expect(Object.keys(snapshot).sort()).toEqual([
      'brands', 'categories', 'coupons', 'productImages', 'productOptionTypes',
      'productOptionValues', 'productSpecs', 'productVariants', 'products',
      'settings', 'shippingRegions', 'shippingRules', 'users', 'variantOptions',
    ]);
  });

  it('serializes Prisma Decimal and Date values as JSON scalar strings', async () => {
    const representative = {
      id: 'product-1',
      basePrice: new Prisma.Decimal('12345.67'),
      createdAt: new Date('2026-07-28T00:00:00.000Z'),
    };
    const findMany = jest.fn().mockResolvedValue([representative]);
    const prisma = {
      user: { findMany },
      brand: { findMany }, category: { findMany }, coupon: { findMany },
      setting: { findMany }, shippingRule: { findMany }, shippingRegion: { findMany },
      product: { findMany }, productImage: { findMany }, productSpec: { findMany },
      productOptionType: { findMany }, productOptionValue: { findMany },
      productVariant: { findMany }, variantOption: { findMany },
    } as any;

    const snapshot = await collectDemoSnapshot(prisma);
    const serialized = JSON.parse(JSON.stringify(snapshot));

    expect(serialized.products).toEqual([{
      id: 'product-1',
      basePrice: '12345.67',
      createdAt: '2026-07-28T00:00:00.000Z',
    }]);
  });
});


describe('restoreDemoSnapshot', () => {
  it('upserts a seeded demo user by email when its source ID differs', async () => {
    const upsert = jest.fn();
    const deleteMany = jest.fn();
    const userFindMany = jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'seed-user-id' }]);
    const tx: any = {
      user: { deleteMany, findMany: userFindMany, upsert },
      setting: { findUnique: jest.fn().mockResolvedValue(null), upsert },
    };
    for (const name of ['category', 'brand', 'coupon', 'shippingRule', 'shippingRegion', 'product', 'productImage', 'productSpec', 'productOptionType', 'productOptionValue', 'productVariant', 'variantOption']) {
      tx[name] = { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert };
    }

    await restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [{ id: 'user-id', email: 'customer@apexgear.vn' }], brands: [{ id: 'brand-id' }], categories: [{ id: 'category-id' }], coupons: [], settings: [{ id: 'setting-id', key: 'demo', value: 'value' }], shippingRules: [],
      shippingRegions: [], products: [], productImages: [], productSpecs: [],
      productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any);

    expect(tx.product.deleteMany).not.toHaveBeenCalled();
    expect(tx.brand.deleteMany).not.toHaveBeenCalled();
    expect(tx.category.deleteMany).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
    expect(userFindMany).toHaveBeenCalledWith({
      where: { id: { in: ['user-id'] } },
      select: { id: true, email: true },
    });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { email: 'customer@apexgear.vn' },
      create: { email: 'customer@apexgear.vn' },
      update: { email: 'customer@apexgear.vn' },
    }));
  });
});



describe('snapshot collision safety', () => {
  it('rejects a same-slug product with a different ID without deleting it', async () => {
    const product = { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([{ id: 'existing-product' }]), upsert: jest.fn() };
    const tx: any = {
      user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() },
      product,
      setting: { upsert: jest.fn() },
    };
    for (const name of ['category', 'brand', 'coupon', 'shippingRule', 'shippingRegion', 'productImage', 'productSpec', 'productOptionType', 'productOptionValue', 'productVariant', 'variantOption']) {
      tx[name] = { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() };
    }

    await expect(restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [], brands: [], categories: [], coupons: [], settings: [], shippingRules: [], shippingRegions: [],
      products: [{ id: 'snapshot-product', slug: 'same-slug' }], productImages: [], productSpecs: [],
      productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any)).rejects.toThrow('Refusing to replace existing product rows with matching slug');

    expect(product.deleteMany).not.toHaveBeenCalled();
    expect(product.upsert).not.toHaveBeenCalled();
  });

  it('rejects a same-ID product whose existing data differs', async () => {
    const product = {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: 'product-id', slug: 'operator-product' }),
      create: jest.fn(),
      upsert: jest.fn(),
    };
    const tx: any = {
      user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() },
      product,
      setting: { upsert: jest.fn() },
    };
    for (const name of ['category', 'brand', 'coupon', 'shippingRule', 'shippingRegion', 'productImage', 'productSpec', 'productOptionType', 'productOptionValue', 'productVariant', 'variantOption']) {
      tx[name] = { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() };
    }

    await expect(restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [], brands: [], categories: [], coupons: [], settings: [], shippingRules: [], shippingRegions: [],
      products: [{ id: 'product-id', slug: 'snapshot-product' }], productImages: [], productSpecs: [],
      productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any)).rejects.toThrow('Refusing to replace existing product rows with different data');

    expect(product.upsert).not.toHaveBeenCalled();
    expect(product.create).not.toHaveBeenCalled();
  });
});

describe('seedDemoSnapshot', () => {
  it('skips restore when the raw snapshot hash marker matches', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const file = path.join(os.tmpdir(), `demo-snapshot-${Date.now()}.json`);
    fs.writeFileSync(file, 'test');
    const hash = require('crypto').createHash('sha256').update('test').digest('hex');
    const prisma: any = { setting: { findUnique: jest.fn().mockResolvedValue({ value: hash }), upsert: jest.fn() } };
    const restore = jest.fn();
    const { seedDemoSnapshot } = require('./seed-demo-snapshot');

    await seedDemoSnapshot(prisma, file, restore);

    expect(restore).not.toHaveBeenCalled();
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
    fs.unlinkSync(file);
  });

  it('writes the marker only after restore succeeds', async () => {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const file = path.join(os.tmpdir(), `demo-snapshot-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ users: [] }));
    const prisma: any = { setting: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn() } };
    const restore = jest.fn().mockRejectedValue(new Error('restore failed'));
    const { seedDemoSnapshot } = require('./seed-demo-snapshot');

    await expect(seedDemoSnapshot(prisma, file, restore)).rejects.toThrow('restore failed');
    expect(prisma.setting.upsert).not.toHaveBeenCalled();
    fs.unlinkSync(file);
  });
});


describe('restore safety', () => {
  it('does not delete selected data while restoring the snapshot', async () => {
    const tx: any = { user: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() }, setting: { upsert: jest.fn() } };
    for (const name of ['variantOption', 'productOptionValue', 'productOptionType', 'productImage', 'productSpec', 'productVariant', 'product', 'shippingRegion', 'shippingRule', 'coupon', 'brand', 'category']) {
      tx[name] = { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() };
    }
    await restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [], brands: [], categories: [], coupons: [], settings: [], shippingRules: [], shippingRegions: [], products: [], productImages: [], productSpecs: [], productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any);
    expect(tx.user.deleteMany).not.toHaveBeenCalled();
    expect(tx.product.deleteMany).not.toHaveBeenCalled();
  });
});


describe('snapshot user and setting safety', () => {
  it('never creates a non-allowlisted snapshot user', async () => {
    const created: any[] = [];
    const tx: any = {
      user: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn(({ create }) => created.push(create)) },
      setting: { upsert: jest.fn() },
    };
    for (const name of ['variantOption', 'productOptionValue', 'productOptionType', 'productImage', 'productSpec', 'productVariant', 'product', 'shippingRegion', 'shippingRule', 'coupon', 'brand', 'category']) {
      tx[name] = {
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        upsert: jest.fn(),
      };
    }
    await restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [{ id: 'foreign-id', email: 'google@example.com' }, { id: 'demo-id', email: 'customer@apexgear.vn' }], brands: [], categories: [], coupons: [], settings: [], shippingRules: [], shippingRegions: [], products: [], productImages: [], productSpecs: [], productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any);
    expect(created).toEqual([{ email: 'customer@apexgear.vn' }]);
  });

  it('fails before deleting a snapshot ID owned by a non-allowlisted user', async () => {
    const tx: any = {
      user: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([{ id: 'foreign-id', email: 'google@example.com' }]), upsert: jest.fn() },
      setting: { upsert: jest.fn() },
    };
    for (const name of ['variantOption', 'productOptionValue', 'productOptionType', 'productImage', 'productSpec', 'productVariant', 'product', 'shippingRegion', 'shippingRule', 'coupon', 'brand', 'category']) tx[name] = { deleteMany: jest.fn(), createMany: jest.fn() };
    await expect(restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [{ id: 'foreign-id', email: 'customer@apexgear.vn' }], brands: [], categories: [], coupons: [], settings: [], shippingRules: [], shippingRegions: [], products: [], productImages: [], productSpecs: [], productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any)).rejects.toThrow('outside the demo allowlist');
    expect(tx.user.deleteMany).not.toHaveBeenCalled();
  });

  it('allows the base-seed settings to be replaced by their snapshot values', async () => {
    const setting = {
      findUnique: jest.fn().mockResolvedValue({ id: 'seed-setting', key: 'store_name', value: 'ApexGear' }),
      upsert: jest.fn(),
    };
    const tx: any = {
      user: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn() },
      setting,
    };
    for (const name of ['variantOption', 'productOptionValue', 'productOptionType', 'productImage', 'productSpec', 'productVariant', 'product', 'shippingRegion', 'shippingRule', 'coupon', 'brand', 'category']) {
      tx[name] = {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        upsert: jest.fn(),
      };
    }

    await restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [], brands: [], categories: [], coupons: [],
      settings: [{ id: 'snapshot-setting', key: 'store_name', value: 'ApexGear' }],
      shippingRules: [], shippingRegions: [], products: [], productImages: [], productSpecs: [],
      productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any);

    expect(setting.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { key: 'store_name' },
      update: { value: 'ApexGear' },
    }));
  });

  it('rejects a same-key setting whose existing data differs', async () => {
    const setting = {
      findUnique: jest.fn().mockResolvedValue({ id: 'existing-setting', key: 'store_name', value: 'Production' }),
      create: jest.fn(),
      upsert: jest.fn(),
    };
    const tx: any = {
      user: { findMany: jest.fn().mockResolvedValue([]), upsert: jest.fn() },
      setting,
    };
    for (const name of ['variantOption', 'productOptionValue', 'productOptionType', 'productImage', 'productSpec', 'productVariant', 'product', 'shippingRegion', 'shippingRule', 'coupon', 'brand', 'category']) {
      tx[name] = {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        upsert: jest.fn(),
      };
    }

    await expect(restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [], brands: [], categories: [], coupons: [],
      settings: [{ id: 'snapshot-setting', key: 'store_name', value: 'ApexGear' }],
      shippingRules: [], shippingRegions: [], products: [], productImages: [], productSpecs: [],
      productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any)).rejects.toThrow('Refusing to replace existing setting with different data');

    expect(setting.create).not.toHaveBeenCalled();
    expect(setting.upsert).not.toHaveBeenCalled();
  });

  it('does not restore the reserved marker from snapshot settings', async () => {
    const upsert = jest.fn();
    const tx: any = {
      user: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null), create: jest.fn(), upsert: jest.fn() },
      setting: { findUnique: jest.fn().mockResolvedValue(null), upsert },
    };
    for (const name of ['variantOption', 'productOptionValue', 'productOptionType', 'productImage', 'productSpec', 'productVariant', 'product', 'shippingRegion', 'shippingRule', 'coupon', 'brand', 'category']) {
      tx[name] = {
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        upsert: jest.fn(),
      };
    }
    await restoreDemoSnapshot({ $transaction: async (fn: any) => fn(tx) } as any, {
      users: [], brands: [], categories: [], coupons: [], settings: [{ id: 'x', key: 'demo_snapshot_imported', value: 'bad' }, { id: 'y', key: 'other', value: 'ok' }], shippingRules: [], shippingRegions: [], products: [], productImages: [], productSpecs: [], productOptionTypes: [], productOptionValues: [], productVariants: [], variantOptions: [],
    } as any);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].where.key).toBe('other');
  });
});
