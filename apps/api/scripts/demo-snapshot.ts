import { Prisma, PrismaClient } from '@prisma/client';

export const DEMO_SNAPSHOT_USER_EMAILS = [
  'customer@apexgear.vn',
  'content@apexgear.vn',
  'inventory@apexgear.vn',
  'order@apexgear.vn',
  'admin@apexgear.vn',
  'superadmin@apexgear.vn',
] as const;

export interface DemoSnapshot {
  users: unknown[];
  brands: unknown[];
  categories: unknown[];
  coupons: unknown[];
  settings: unknown[];
  shippingRules: unknown[];
  shippingRegions: unknown[];
  products: unknown[];
  productImages: unknown[];
  productSpecs: unknown[];
  productOptionTypes: unknown[];
  productOptionValues: unknown[];
  productVariants: unknown[];
  variantOptions: unknown[];
}

export async function collectDemoSnapshot(prisma: PrismaClient): Promise<DemoSnapshot> {
  const [
    users,
    brands,
    categories,
    coupons,
    settings,
    shippingRules,
    shippingRegions,
    products,
    productImages,
    productSpecs,
    productOptionTypes,
    productOptionValues,
    productVariants,
    variantOptions,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: [...DEMO_SNAPSHOT_USER_EMAILS] } },
      orderBy: { email: 'asc' },
    }),
    prisma.brand.findMany({ orderBy: { id: 'asc' } }),
    prisma.category.findMany({ orderBy: { id: 'asc' } }),
    prisma.coupon.findMany({ orderBy: { id: 'asc' } }),
    prisma.setting.findMany({ orderBy: { id: 'asc' } }),
    prisma.shippingRule.findMany({ orderBy: { id: 'asc' } }),
    prisma.shippingRegion.findMany({ orderBy: { id: 'asc' } }),
    prisma.product.findMany({ orderBy: { id: 'asc' } }),
    prisma.productImage.findMany({ orderBy: { id: 'asc' } }),
    prisma.productSpec.findMany({ orderBy: { id: 'asc' } }),
    prisma.productOptionType.findMany({ orderBy: { id: 'asc' } }),
    prisma.productOptionValue.findMany({ orderBy: { id: 'asc' } }),
    prisma.productVariant.findMany({ orderBy: { id: 'asc' } }),
    prisma.variantOption.findMany({ orderBy: { id: 'asc' } }),
  ]);

  return {
    users,
    brands,
    categories,
    coupons,
    settings,
    shippingRules,
    shippingRegions,
    products,
    productImages,
    productSpecs,
    productOptionTypes,
    productOptionValues,
    productVariants,
    variantOptions,
  };
}


const RESTORE_UPSERT_ORDER = [
  'users', 'categories', 'brands', 'coupons', 'shippingRules', 'shippingRegions',
  'products', 'productImages', 'productSpecs', 'productOptionTypes',
  'productOptionValues', 'productVariants', 'variantOptions',
] as const;

const DECIMAL_FIELDS: Record<string, readonly string[]> = {
  products: ['basePrice', 'salePrice'],
  coupons: ['value', 'minOrderValue', 'maxDiscount'],
  shippingRules: ['fee', 'freeShippingThreshold'],
  productVariants: ['price'],
};

const DATE_FIELDS: Record<string, readonly string[]> = {
  users: ['emailVerifiedAt', 'lockedUntil', 'createdAt', 'updatedAt', 'deletedAt'],
  brands: ['createdAt', 'updatedAt', 'deletedAt'],
  categories: ['createdAt', 'updatedAt', 'deletedAt'],
  coupons: ['startsAt', 'expiresAt', 'createdAt', 'updatedAt'],
  shippingRules: ['createdAt', 'updatedAt'],
  products: ['createdAt', 'updatedAt', 'deletedAt'],
  productImages: ['createdAt', 'updatedAt'],
  productVariants: ['createdAt', 'updatedAt', 'deletedAt'],
};

function restoreValue(model: string, row: unknown): Record<string, unknown> {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error(`Invalid ${model} row in demo snapshot`);
  }
  const value = { ...(row as Record<string, unknown>) };
  for (const field of DECIMAL_FIELDS[model] ?? []) {
    if (typeof value[field] === 'string' || typeof value[field] === 'number') value[field] = new Prisma.Decimal(value[field] as string | number);
  }
  for (const field of DATE_FIELDS[model] ?? []) {
    if (typeof value[field] === 'string') {
      const parsed = new Date(value[field] as string);
      if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${model}.${field} date in demo snapshot`);
      value[field] = parsed;
    }
  }
  return value;
}

async function upsertRows(tx: any, model: string, rows: unknown[]): Promise<void> {
  for (const row of rows) {
    const data = restoreValue(model, row);
    if (typeof data.id !== 'string') throw new Error(`Invalid ${model}.id in demo snapshot`);

    const existing = await tx[model].findUnique({ where: { id: data.id } });
    if (existing) {
      const snapshotValue = JSON.stringify(data);
      const existingValue = JSON.stringify(Object.fromEntries(
        Object.entries(existing).filter(([key]) => key in data),
      ));
      if (existingValue !== snapshotValue) {
        throw new Error(`Refusing to replace existing ${model} rows with different data`);
      }
      continue;
    }

    await tx[model].create({ data });
  }
}

async function upsertUsers(tx: any, rows: Record<string, unknown>[]): Promise<void> {
  for (const { id: _id, ...data } of rows) {
    if (typeof data.email !== 'string') throw new Error('Invalid users.email in demo snapshot');
    await tx.user.upsert({ where: { email: data.email }, create: data, update: data });
  }
}

async function rejectNaturalKeyConflicts(tx: any, model: string, rows: unknown[], key: string): Promise<void> {
  const data = rows.map((row) => restoreValue(model, row));
  const values = data.map((row) => row[key]).filter((value): value is string => typeof value === 'string');
  const ids = data.map((row) => row.id).filter((id): id is string => typeof id === 'string');
  if (values.length && ids.length) {
    const conflicts = await tx[model].findMany({
      where: { AND: [{ [key]: { in: values } }, { id: { notIn: ids } }] },
      select: { id: true },
    });
    if (conflicts.length) throw new Error(`Refusing to replace existing ${model} rows with matching ${key}`);
  }
}

export async function restoreDemoSnapshot(prisma: PrismaClient, snapshot: DemoSnapshot): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    try {
      const snapshotUsers = snapshot.users
        .map((row) => restoreValue('users', row))
        .filter((row) => typeof row.email === 'string' && DEMO_SNAPSHOT_USER_EMAILS.includes(row.email as typeof DEMO_SNAPSHOT_USER_EMAILS[number]));
      const snapshotIds = snapshotUsers
        .map((row) => row.id)
        .filter((id): id is string => typeof id === 'string');
      const existingUsers = await (tx as any).user.findMany({
        where: { id: { in: snapshotIds } },
        select: { id: true, email: true },
      });
      for (const user of existingUsers) {
        if (!DEMO_SNAPSHOT_USER_EMAILS.includes(user.email as typeof DEMO_SNAPSHOT_USER_EMAILS[number])) {
          throw new Error(`Refusing to replace snapshot user ${user.id}: existing email is outside the demo allowlist`);
        }
      }
      await rejectNaturalKeyConflicts(tx, 'category', snapshot.categories, 'slug');
      await rejectNaturalKeyConflicts(tx, 'brand', snapshot.brands, 'slug');
      await rejectNaturalKeyConflicts(tx, 'coupon', snapshot.coupons, 'code');
      await rejectNaturalKeyConflicts(tx, 'product', snapshot.products, 'slug');
      await rejectNaturalKeyConflicts(tx, 'productVariant', snapshot.productVariants, 'sku');
      for (const model of RESTORE_UPSERT_ORDER) {
        const rows = model === 'users' ? snapshotUsers : snapshot[model];
        if (model === 'users') await upsertUsers(tx, rows as Record<string, unknown>[]);
        else await upsertRows(tx, model === 'categories' ? 'category' : model.replace(/s$/, ''), rows);
      }
      for (const setting of snapshot.settings) {
        const row = restoreValue('settings', setting);
        if (row.key === 'demo_snapshot_imported') continue;
        if (typeof row.key !== 'string' || typeof row.value !== 'string') throw new Error('Invalid setting row in demo snapshot');
        const existing = await (tx as any).setting.findUnique({ where: { key: row.key } });
        if (existing && existing.value !== row.value) {
          throw new Error('Refusing to replace existing setting with different data');
        }
        await (tx as any).setting.upsert({ where: { key: row.key }, update: { value: row.value }, create: row });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Demo snapshot restore failed; excluded relations may still reference selected records: ${message}`);
    }
  }, { timeout: 60_000 });
}
