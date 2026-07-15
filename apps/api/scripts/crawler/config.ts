import * as path from 'path';
import { CategoryKey, CrawlLimits } from './types';

export interface BrandFilter {
  brandName: string;   // canonical display name (fallback if Haravan vendor missing)
  brandSlug: string;   // GearVN `?hang=` value or man-hinh-<slug>
  url: string;         // brand-filtered collection URL
}
export interface CategoryConfig {
  key: CategoryKey;
  name: string;        // MUST match parents in apps/api/prisma/seed.ts
  brands: BrandFilter[]; // exactly 4
}

const KB = 'https://gearvn.com/collections/ban-phim-may-tinh';
const HP = 'https://gearvn.com/collections/tai-nghe-may-tinh';
const MS = 'https://gearvn.com/collections/chuot-may-tinh';
const hang = (base: string, slug: string) => `${base}?hang=${slug}`;

/**
 * Category names MUST match prisma/seed.ts. Brand `?hang=` slugs are best-effort
 * and CONFIRMED in Task 2 (inspect); Haravan `vendor` is authoritative for the
 * stored brand name regardless. Monitor uses explicit per-brand collections.
 */
export const CATEGORIES: CategoryConfig[] = [
  {
    key: 'ban-phim', name: 'Bàn phím',
    brands: [
      { brandName: 'Akko',        brandSlug: 'akko',        url: hang(KB, 'akko') },
      { brandName: 'Logitech',    brandSlug: 'logitech',    url: hang(KB, 'logitech') },
      { brandName: 'Corsair',     brandSlug: 'corsair',     url: hang(KB, 'corsair') },
      { brandName: 'Steelseries', brandSlug: 'steelseries', url: hang(KB, 'steelseries') },
    ],
  },
  {
    key: 'tai-nghe', name: 'Tai nghe',
    brands: [
      { brandName: 'Logitech',    brandSlug: 'logitech',    url: hang(HP, 'logitech') },
      { brandName: 'Corsair',     brandSlug: 'corsair',     url: hang(HP, 'corsair') },
      { brandName: 'Steelseries', brandSlug: 'steelseries', url: hang(HP, 'steelseries') },
      { brandName: 'HyperX',      brandSlug: 'hyperx',      url: hang(HP, 'hyperx') },
    ],
  },
  {
    key: 'chuot', name: 'Chuột',
    brands: [
      { brandName: 'Logitech',    brandSlug: 'logitech',    url: hang(MS, 'logitech') },
      { brandName: 'Razer',       brandSlug: 'razer',       url: hang(MS, 'razer') },
      { brandName: 'Corsair',     brandSlug: 'corsair',     url: hang(MS, 'corsair') },
      { brandName: 'Steelseries', brandSlug: 'steelseries', url: hang(MS, 'steelseries') },
    ],
  },
  {
    key: 'man-hinh', name: 'Màn hình',
    brands: [
      { brandName: 'Asus',     brandSlug: 'asus',     url: 'https://gearvn.com/collections/man-hinh-asus' },
      { brandName: 'Acer',     brandSlug: 'acer',     url: 'https://gearvn.com/collections/man-hinh-acer' },
      { brandName: 'MSI',      brandSlug: 'msi',      url: 'https://gearvn.com/collections/man-hinh-msi' },
      { brandName: 'Gigabyte', brandSlug: 'gigabyte', url: 'https://gearvn.com/collections/man-hinh-gigabyte' },
    ],
  },
];

export const LIMITS: CrawlLimits = {
  maxProductsPerBrand: Math.min(10, Math.max(5, Number(process.env.MAX_PRODUCTS_PER_BRAND ?? 6))),
  maxImagesPerProduct: Number(process.env.MAX_IMAGES_PER_PRODUCT ?? 4),
  requestDelayMs: Number(process.env.REQUEST_DELAY_MS ?? 800),
};

/** Haravan single-variant placeholders — treated as "no real options". */
export const PLACEHOLDER_OPTION_NAMES = ['title', 'tiêu đề', 'tieu de'];
export const PLACEHOLDER_OPTION_VALUES = ['default title', 'default', 'tiêu đề mặc định'];

/** Listing-page + DOM-fallback selectors (GearVN Haravan theme); confirm in Task 2. */
export const SELECTORS = {
  productLink: 'a[href*="/products/"]',
  detailTitle: 'h1',
  detailPrice: '[class*="price"]',
  detailImages: 'img[src*="/products/"]',
  specRow: 'table tr',
};

export const OUTPUT_DIR = path.resolve(__dirname, 'output');
