import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { OUTPUT_DIR } from './config';
import { slugify } from './transformers';
import { TransformedProduct } from './types';

export interface SeedPlan {
  brands: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
  products: TransformedProduct[];
}

/** Pure: derive the unique brands/categories a product set references. */
export function buildSeedOperations(products: TransformedProduct[]): SeedPlan {
  const brands = new Map<string, { name: string; slug: string }>();
  const categories = new Map<string, { name: string; slug: string }>();
  for (const p of products) {
    brands.set(p.brandSlug, { name: p.brandName, slug: p.brandSlug });
    categories.set(p.categoryKey, { name: p.categoryName, slug: slugify(p.categoryName) });
  }
  return { brands: [...brands.values()], categories: [...categories.values()], products };
}

/**
 * Idempotently upsert a set of transformed products (with their brands,
 * categories, images, specs, options and variants) into the `apexgear` DB using
 * the given Prisma client. Reused by both the file-based seeder (tier 1 legacy)
 * and the raw→apex transform (tier 2).
 */
export async function upsertProducts(prisma: PrismaClient, products: TransformedProduct[]): Promise<number> {
  const plan = buildSeedOperations(products);
  const brandIds = new Map<string, string>();
  for (const b of plan.brands) {
    const row = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: { name: b.name, slug: b.slug, isActive: true } });
    brandIds.set(b.slug, row.id);
  }
  const categoryIds = new Map<string, string>();
  for (const c of plan.categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { name: c.name, slug: c.slug, isActive: true } });
    categoryIds.set(c.slug, row.id);
  }

  let count = 0;
  for (const p of plan.products) {
    const categoryId = categoryIds.get(slugify(p.categoryName))!;
    const brandId = brandIds.get(p.brandSlug)!;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { basePrice: p.basePrice, salePrice: p.salePrice, isActive: p.isActive, description: p.descriptionHtml, specifications: p.specificationsJson },
      create: {
        name: p.name, slug: p.slug, shortDescription: p.shortDescription, description: p.descriptionHtml,
        specifications: p.specificationsJson, basePrice: p.basePrice, salePrice: p.salePrice,
        categoryId, brandId, isActive: p.isActive, isFeatured: false,
      },
    });

    // Images & specs: cascade-safe replace.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const uploaded = p.images.filter((img) => img.publicId); // only Cloudinary-backed images
    if (uploaded.length) {
      await prisma.productImage.createMany({ data: uploaded.map((img) => ({ productId: product.id, url: img.url, publicId: img.publicId, alt: img.alt, isPrimary: img.isPrimary, sortOrder: img.sortOrder })) });
    }
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });
    if (p.specs.length) {
      // Clamp to schema column limits: group/name NVarChar(255), value NVarChar(500).
      const clamp = (s: string | null | undefined, max: number) =>
        s == null ? s : s.length > max ? s.slice(0, max) : s;
      await prisma.productSpec.createMany({ data: p.specs.map((s) => ({ productId: product.id, group: clamp(s.group, 255), name: clamp(s.name, 255)!, value: clamp(s.value, 500)!, sortOrder: s.sortOrder })) });
    }

    // Option types & values (upsert; variants may be order-referenced so never deleted).
    const valueIds = new Map<string, string>(); // `${typeName}::${value}` -> id
    for (const ot of p.optionTypes) {
      const typeRow = await prisma.productOptionType.upsert({
        where: { productId_name: { productId: product.id, name: ot.name } },
        update: { sortOrder: ot.sortOrder },
        create: { productId: product.id, name: ot.name, sortOrder: ot.sortOrder },
      });
      for (const [i, val] of ot.values.entries()) {
        const valRow = await prisma.productOptionValue.upsert({
          where: { optionTypeId_value: { optionTypeId: typeRow.id, value: val } },
          update: { sortOrder: i },
          create: { optionTypeId: typeRow.id, value: val, sortOrder: i },
        });
        valueIds.set(`${ot.name}::${val}`, valRow.id);
      }
    }

    for (const v of p.variants) {
      const variant = await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { price: v.price, stockTotal: v.stockTotal, stockAvailable: v.stockAvailable, isActive: true, attributes: v.attributesJson, displayOrder: v.displayOrder },
        create: {
          productId: product.id, sku: v.sku, name: v.name, price: v.price,
          stockTotal: v.stockTotal, stockAvailable: v.stockAvailable, isDefault: v.isDefault,
          isActive: true, attributes: v.attributesJson, displayOrder: v.displayOrder,
        },
      });
      for (const opt of v.options) {
        const optionValueId = valueIds.get(`${opt.typeName}::${opt.value}`);
        if (!optionValueId) continue;
        await prisma.variantOption.upsert({
          where: { variantId_optionValueId: { variantId: variant.id, optionValueId } },
          update: {},
          create: { variantId: variant.id, optionValueId },
        });
      }
    }
    count++;
    console.log(`  ✓ ${p.brandName} — ${p.name} (${p.variants.length} variant, ${uploaded.length} img)`);
  }
  console.log(`🎉 Upsert complete: ${count} products, ${plan.brands.length} brands, ${plan.categories.length} categories.`);
  return count;
}

export async function seedCrawled(): Promise<void> {
  const file = path.join(OUTPUT_DIR, 'all-products.json');
  if (!fs.existsSync(file)) throw new Error(`Missing ${file} — run \`npm run crawl\` first.`);
  const products: TransformedProduct[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const prisma = new PrismaClient();
  try {
    await upsertProducts(prisma, products);
  } finally {
    await prisma.$disconnect();
  }
}

/** @deprecated legacy inline body kept for reference; use upsertProducts. */
async function seedCrawledLegacy(): Promise<void> {
  const file = path.join(OUTPUT_DIR, 'all-products.json');
  if (!fs.existsSync(file)) throw new Error(`Missing ${file} — run \`npm run crawl\` first.`);
  const products: TransformedProduct[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const plan = buildSeedOperations(products);
  const prisma = new PrismaClient();

  try {
    const brandIds = new Map<string, string>();
    for (const b of plan.brands) {
      const row = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: { name: b.name, slug: b.slug, isActive: true } });
      brandIds.set(b.slug, row.id);
    }
    const categoryIds = new Map<string, string>();
    for (const c of plan.categories) {
      const row = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: { name: c.name, slug: c.slug, isActive: true } });
      categoryIds.set(c.slug, row.id);
    }

    let count = 0;
    for (const p of plan.products) {
      const categoryId = categoryIds.get(slugify(p.categoryName))!;
      const brandId = brandIds.get(p.brandSlug)!;

      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: { basePrice: p.basePrice, salePrice: p.salePrice, isActive: p.isActive, description: p.descriptionHtml, specifications: p.specificationsJson },
        create: {
          name: p.name, slug: p.slug, shortDescription: p.shortDescription, description: p.descriptionHtml,
          specifications: p.specificationsJson, basePrice: p.basePrice, salePrice: p.salePrice,
          categoryId, brandId, isActive: p.isActive, isFeatured: false,
        },
      });

      // Images & specs: cascade-safe replace.
      await prisma.productImage.deleteMany({ where: { productId: product.id } });
      const uploaded = p.images.filter((img) => img.publicId); // only Cloudinary-backed images
      if (uploaded.length) {
        await prisma.productImage.createMany({ data: uploaded.map((img) => ({ productId: product.id, url: img.url, publicId: img.publicId, alt: img.alt, isPrimary: img.isPrimary, sortOrder: img.sortOrder })) });
      }
      await prisma.productSpec.deleteMany({ where: { productId: product.id } });
      if (p.specs.length) {
        // Clamp to schema column limits: group/name NVarChar(255), value NVarChar(500).
        const clamp = (s: string | null | undefined, max: number) =>
          s == null ? s : s.length > max ? s.slice(0, max) : s;
        await prisma.productSpec.createMany({ data: p.specs.map((s) => ({ productId: product.id, group: clamp(s.group, 255), name: clamp(s.name, 255)!, value: clamp(s.value, 500)!, sortOrder: s.sortOrder })) });
      }

      // Option types & values (upsert; variants may be order-referenced so never deleted).
      const valueIds = new Map<string, string>(); // `${typeName}::${value}` -> id
      for (const ot of p.optionTypes) {
        const typeRow = await prisma.productOptionType.upsert({
          where: { productId_name: { productId: product.id, name: ot.name } },
          update: { sortOrder: ot.sortOrder },
          create: { productId: product.id, name: ot.name, sortOrder: ot.sortOrder },
        });
        for (const [i, val] of ot.values.entries()) {
          const valRow = await prisma.productOptionValue.upsert({
            where: { optionTypeId_value: { optionTypeId: typeRow.id, value: val } },
            update: { sortOrder: i },
            create: { optionTypeId: typeRow.id, value: val, sortOrder: i },
          });
          valueIds.set(`${ot.name}::${val}`, valRow.id);
        }
      }

      for (const v of p.variants) {
        const variant = await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: { price: v.price, stockTotal: v.stockTotal, stockAvailable: v.stockAvailable, isActive: true, attributes: v.attributesJson, displayOrder: v.displayOrder },
          create: {
            productId: product.id, sku: v.sku, name: v.name, price: v.price,
            stockTotal: v.stockTotal, stockAvailable: v.stockAvailable, isDefault: v.isDefault,
            isActive: true, attributes: v.attributesJson, displayOrder: v.displayOrder,
          },
        });
        for (const opt of v.options) {
          const optionValueId = valueIds.get(`${opt.typeName}::${opt.value}`);
          if (!optionValueId) continue;
          await prisma.variantOption.upsert({
            where: { variantId_optionValueId: { variantId: variant.id, optionValueId } },
            update: {},
            create: { variantId: variant.id, optionValueId },
          });
        }
      }
      count++;
      console.log(`  ✓ ${p.brandName} — ${p.name} (${p.variants.length} variant, ${uploaded.length} img)`);
    }
    console.log(`🎉 Seed complete: ${count} products, ${plan.brands.length} brands, ${plan.categories.length} categories.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCrawled().catch((e) => { console.error(e); process.exit(1); });
}
