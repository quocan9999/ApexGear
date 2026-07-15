# Data Crawler (Demo Data) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crawl a small, demo-sized set of real products (with their real variants and images) from GearVN.com and seed them into the existing ApexGear SQL Server database, uploading product images to Cloudinary, so the web app has realistic data to demo.

**Architecture:** A standalone TypeScript toolchain under `apps/api/scripts/crawler/` that reuses apps/api's Prisma client, Cloudinary config, and `ts-node`. Flow: for each of 4 fixed categories, for each of 4 chosen brands, Playwright visits the brand-filtered collection page → collects product detail URLs → fetches each product's Haravan JSON (`{productUrl}.json`) for authoritative title/vendor/price/variants/images (DOM fallback for robustness) → pure transformers normalize into DB-ready JSON → **Cloudinary upload** of each image under `apexgear/products/{category}/{brand}/` → JSON written to `output/` → an idempotent seed script upserts categories, brands, products, images, specs, option types, and variants. Pure functions are unit-tested with Jest; the Playwright/Cloudinary/DB layers are verified by a small **test crawl** before any full run.

**Tech Stack:** TypeScript 5.7 (commonjs, ts-node), Playwright (chromium + APIRequestContext), Prisma 5.22 (SQL Server), Cloudinary 2.5.1 (already a dep), Jest 29 + ts-jest, dotenv.

## Global Constraints

- Node/TS: `module=commonjs`, `target=ES2021`, `strict=true` (inherit `apps/api/tsconfig.json`). Run scripts with `ts-node`.
- All crawler code lives under `apps/api/scripts/crawler/`. Commands below assume cwd = `apps/api` (the workspace) unless stated.
- Prisma provider is `sqlserver`; **no Prisma enums, no `Json` type** — JSON stored as `NVarChar(Max)` strings.
- `ProductImage.publicId` is **NOT nullable** — every image row sets it (Cloudinary `public_id`).
- Every product **must** get at least one `ProductVariant` (cart/order reference variants). Exactly one variant per product is `isDefault: true`.
- **Slugs are all lowercase** (enforced by `slugify`, which also strips Vietnamese diacritics). Verified by test.
- **Categories** are fixed to the 4 already in `prisma/seed.ts`: **Tai nghe, Màn hình, Chuột, Bàn phím** (match existing slugs — do not create duplicates).
- **Exactly 4 brands per category**, **5–10 products per brand**. Default `MAX_PRODUCTS_PER_BRAND = 6`, capped to the 5–10 band. Default `MAX_IMAGES_PER_PRODUCT = 4` to bound upload time.
- **Brand-filtered collection URLs (from the user):**
  - Bàn phím: base `https://gearvn.com/collections/ban-phim-may-tinh`, per-brand `?hang=<brandSlug>`
  - Tai nghe: base `https://gearvn.com/collections/tai-nghe-may-tinh`, per-brand `?hang=<brandSlug>`
  - Chuột: base `https://gearvn.com/collections/chuot-may-tinh`, per-brand `?hang=<brandSlug>`
  - Màn hình (4 explicit per-brand collections, no `?hang=`): `man-hinh-asus`, `man-hinh-acer`, `man-hinh-msi`, `man-hinh-gigabyte`
- **Crawl the real product variants** (not a synthetic single variant): read `options` + `variants` from the Haravan product JSON, seed each as a `ProductVariant`, and populate `ProductOptionType`/`ProductOptionValue`/`VariantOption` when the product has real (non-placeholder) options.
- **Cloudinary upload is required** (the user has it set up; only `.env` needs values). Root folder `apexgear`, subdivided as `apexgear/products/{categoryKey}/{brandSlug}/`. An escape hatch `SKIP_UPLOAD=true` exists only for offline unit runs; the real crawl uploads.
- Crawl **sequentially** with a polite delay (`REQUEST_DELAY_MS = 800`) between product fetches — the user's own low-volume demo use; no parallel hammering.
- **Always test-crawl first:** a `CRAWL_TEST=true` mode crawls 1 brand × 2 products and prints a summary, so extraction is proven before a full multi-category run.
- Seed must be **idempotent**: upsert categories/brands by `slug`, products by `slug`, variants by `sku`, option types by `(productId,name)`, option values by `(optionTypeId,value)`, variant-options by `(variantId,optionValueId)`. Re-running must not duplicate rows.
- Do **not** touch the existing `jest` config in `apps/api/package.json` (the 154-test api suite must stay green). Crawler tests run under a separate config.
- **Branch strategy (explicit user requirement):** all work happens on branch `feat/crawler`, created from `main` in the **main repository working directory** `E:\SourceCode\ApexGear` — **NOT a git worktree**. After Task 1, `git branch` must list both `main` and `feat/crawler` as siblings. Commit in **small increments** as each task completes — never one big commit at the end.
- Maintain a live todo list while executing (one item per task); mark in_progress on start, completed when its commit lands.
- **Required `.env` (in `apps/api/.env`):** `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Never print these values.

---

## File Structure

- `apps/api/scripts/crawler/types.ts` — shared interfaces (raw + transformed shapes, config).
- `apps/api/scripts/crawler/config.ts` — category→brand URL map, volume/delay knobs, DOM selectors, output dir.
- `apps/api/scripts/crawler/transformers.ts` — pure functions: `slugify`, `parsePrice`, `buildSku`, `stripHtml`, `isPlaceholderOption`, `normalizeSpecs`, `toTransformedProduct`.
- `apps/api/scripts/crawler/gearvn.crawler.ts` — Playwright: `crawlBrandListing`, `fetchProductJson`, `crawlProductDetail`.
- `apps/api/scripts/crawler/inspect.ts` — one-off helper to confirm listing selectors, `?hang=` values, and the `.json` endpoint shape.
- `apps/api/scripts/crawler/uploader.ts` — Cloudinary upload (`uploadImages`) with DI for tests.
- `apps/api/scripts/crawler/index.ts` — orchestration (test + full mode) → writes `output/*.json`.
- `apps/api/scripts/crawler/seed-crawled.ts` — reads `output/all-products.json` → `buildSeedOperations` → Prisma upserts.
- `apps/api/scripts/crawler/output/` — generated JSON (gitignored).
- `apps/api/scripts/crawler/README.md` — usage docs.
- Tests: `transformers.spec.ts`, `uploader.spec.ts`, `seed-crawled.spec.ts`.
- `apps/api/jest.crawler.config.js` — dedicated Jest config (rootDir `scripts`).

---

## Task 1: Branch, tooling, types & config

**Files:**
- Create branch: `feat/crawler` (in `E:\SourceCode\ApexGear`)
- Modify: `apps/api/package.json` (devDeps + scripts)
- Create: `apps/api/jest.crawler.config.js`
- Create: `apps/api/scripts/crawler/output/.gitignore`
- Create: `apps/api/scripts/crawler/types.ts`
- Create: `apps/api/scripts/crawler/config.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `types.ts`: `CategoryKey`, `RawSpecRow`, `RawVariant`, `RawProduct`, `TransformedImage`, `TransformedSpec`, `TransformedOptionType`, `TransformedVariant`, `TransformedProduct`, `CrawlLimits`.
  - `config.ts`: `CATEGORIES: CategoryConfig[]` (each with 4 `BrandFilter`s), `LIMITS: CrawlLimits`, `SELECTORS`, `OUTPUT_DIR: string`, `PLACEHOLDER_OPTION_NAMES`, `PLACEHOLDER_OPTION_VALUES`.

- [ ] **Step 1: Create the branch off `main` (not a worktree)**

Run:
```bash
git -C "E:/SourceCode/ApexGear" checkout main
git -C "E:/SourceCode/ApexGear" checkout -b feat/crawler
git -C "E:/SourceCode/ApexGear" branch
```
Expected: output lists both `main` and `* feat/crawler`. All remaining steps run inside `E:/SourceCode/ApexGear` on `feat/crawler`.

- [ ] **Step 2: Add Playwright + dotenv devDeps and install chromium**

Run (cwd = `apps/api`):
```bash
npm install -D playwright@^1.48.0 dotenv@^16.4.5 -w apps/api
npx playwright install chromium
```
Expected: `playwright`, `dotenv` under `devDependencies`; chromium downloads.

- [ ] **Step 3: Add npm scripts to `apps/api/package.json`** (keep existing entries)

```json
    "crawl:inspect": "ts-node scripts/crawler/inspect.ts",
    "crawl:test": "cross-env-shell CRAWL_TEST=true ts-node scripts/crawler/index.ts",
    "crawl": "ts-node scripts/crawler/index.ts",
    "seed:crawled": "ts-node scripts/crawler/seed-crawled.ts",
    "test:crawler": "jest --config jest.crawler.config.js --passWithNoTests"
```
Note: `crawl:test` sets an env var cross-platform. Since `cross-env` is not a dependency, on Windows PowerShell run the test crawl as `$env:CRAWL_TEST='true'; npm run crawl` instead — OR add `cross-env` as a devDep in this step (`npm install -D cross-env@^7.0.3 -w apps/api`) and keep the script above. This plan adds `cross-env`.

Run:
```bash
npm install -D cross-env@^7.0.3 -w apps/api
```

- [ ] **Step 4: Create the dedicated Jest config**

Create `apps/api/jest.crawler.config.js`:
```js
/** Jest config for crawler unit tests — isolated from the api `src` suite. */
module.exports = {
  rootDir: 'scripts',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
};
```

- [ ] **Step 5: Gitignore generated output**

Create `apps/api/scripts/crawler/output/.gitignore`:
```gitignore
# Generated crawl artifacts — do not commit scraped data.
*
!.gitignore
```

- [ ] **Step 6: Define shared types**

Create `apps/api/scripts/crawler/types.ts`:
```ts
/** One of the four fixed storefront categories (matches prisma/seed.ts). */
export type CategoryKey = 'tai-nghe' | 'man-hinh' | 'chuot' | 'ban-phim';

export interface RawSpecRow { group?: string; name: string; value: string; }

/** A single variant as read from the Haravan product JSON. */
export interface RawVariant {
  title: string;                                  // e.g. "Blue Switch" or "Default Title"
  sku: string;                                    // may be empty
  price: number;                                  // VND
  compareAtPrice: number | null;                  // struck-through price if on sale
  available: boolean;
  options: { name: string; value: string }[];     // option name→value pairs
  imageUrl?: string;
}

/** Raw product exactly as extracted (JSON-first, DOM fallback). */
export interface RawProduct {
  categoryKey: CategoryKey;
  brandName: string;          // authoritative: Haravan `vendor`, else configured brand
  sourceUrl: string;
  title: string;
  descriptionHtml: string;    // Haravan body_html (rich text)
  imageUrls: string[];        // absolute, primary first
  specs: RawSpecRow[];
  variants: RawVariant[];
  inStock: boolean;
}

export interface TransformedImage { url: string; publicId: string; alt: string; isPrimary: boolean; sortOrder: number; }
export interface TransformedSpec { group: string | null; name: string; value: string; sortOrder: number; }
export interface TransformedOptionType { name: string; values: string[]; sortOrder: number; }

export interface TransformedVariant {
  sku: string;
  name: string;
  price: number;
  stockTotal: number;
  stockAvailable: number;
  isDefault: boolean;
  attributesJson: string;                          // JSON of {optionName: value}
  options: { typeName: string; value: string }[];  // empty when product has no real options
  displayOrder: number;
}

/** DB-ready product written to output JSON and consumed by the seeder. */
export interface TransformedProduct {
  categoryKey: CategoryKey;
  categoryName: string;
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  descriptionHtml: string | null;
  basePrice: number;
  salePrice: number | null;
  specificationsJson: string;   // for Product.specifications
  isActive: boolean;
  images: TransformedImage[];
  specs: TransformedSpec[];
  optionTypes: TransformedOptionType[];
  variants: TransformedVariant[];
}

export interface CrawlLimits {
  maxProductsPerBrand: number;
  maxImagesPerProduct: number;
  requestDelayMs: number;
}
```

- [ ] **Step 7: Define config**

Create `apps/api/scripts/crawler/config.ts`:
```ts
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
```

- [ ] **Step 8: Verify tooling wiring**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
npx tsc --noEmit -p tsconfig.json
```
Expected: `test:crawler` prints "No tests found ... passWithNoTests" and exits 0; `tsc --noEmit` clean for new files.

- [ ] **Step 9: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json apps/api/jest.crawler.config.js apps/api/scripts/crawler/types.ts apps/api/scripts/crawler/config.ts apps/api/scripts/crawler/output/.gitignore docs/superpowers/plans/2026-07-15-phase-crawler-demo-data.md
git commit -m "chore(crawler): scaffold tooling, types, and GearVN brand/category config"
```

---

## Task 2: Selector & endpoint discovery (inspect)

**Files:**
- Create: `apps/api/scripts/crawler/inspect.ts`
- Modify (if needed): `apps/api/scripts/crawler/config.ts` (`brandSlug`/`url`/`SELECTORS`)

**Interfaces:**
- Consumes: `config.ts` (`CATEGORIES`, `SELECTORS`).
- Produces: no exports — a verification tool. Confirms product links appear on brand-filtered pages, and that `{productUrl}.json` returns `product.variants`/`images`/`vendor`.

- [ ] **Step 1: Write the inspection helper**

Create `apps/api/scripts/crawler/inspect.ts`:
```ts
/**
 * Discovery: opens a brand-filtered collection page, prints product links, then
 * fetches the first product's Haravan JSON and prints its shape (vendor, price,
 * variant/option/image counts). Confirms config before a real crawl.
 * Usage: `npm run crawl:inspect -- "<brandCollectionUrl>"`
 */
import { chromium } from 'playwright';
import { CATEGORIES, SELECTORS } from './config';

async function main() {
  const url = process.argv[2] ?? CATEGORIES[0].brands[0].url;
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const links = await page.$$eval(SELECTORS.productLink, (as) =>
    Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).href)))
      .filter((h) => h.includes('/products/')).slice(0, 10));
  console.log(`--- ${links.length} product links on ${url} ---`);
  console.log(links.join('\n'));

  if (links[0]) {
    const jsonUrl = links[0].split('?')[0].replace(/\/$/, '') + '.json';
    const resp = await page.context().request.get(jsonUrl);
    console.log(`\n--- ${jsonUrl} => HTTP ${resp.status()} ---`);
    if (resp.ok()) {
      const body = await resp.json();
      const p = body.product ?? body;
      console.log(JSON.stringify({
        title: p.title, vendor: p.vendor,
        options: (p.options ?? []).map((o: any) => ({ name: o.name, values: o.values })),
        variantCount: (p.variants ?? []).length,
        firstVariant: (p.variants ?? [])[0] && {
          title: p.variants[0].title, sku: p.variants[0].sku,
          price: p.variants[0].price, compare_at_price: p.variants[0].compare_at_price,
          available: p.variants[0].available,
        },
        imageCount: (p.images ?? []).length,
        firstImage: (p.images ?? [])[0]?.src,
      }, null, 2));
    }
  }
  console.log('\nConfirm: links present, JSON HTTP 200, price is in VND (not cents), vendor set.');
  console.log('If a `?hang=` page shows no products, fix the brandSlug/url in config.ts.');
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run discovery for one brand per category and confirm config**

Run (cwd = `apps/api`), at minimum once per category:
```bash
npm run crawl:inspect -- "https://gearvn.com/collections/chuot-may-tinh?hang=logitech"
npm run crawl:inspect -- "https://gearvn.com/collections/man-hinh-asus"
```
Expected: each prints ≥1 product link and a JSON block with `variantCount >= 1`, a numeric `price` that matches the on-site VND price (confirm it is NOT in cents — if it is 100× too big, note it for Step-adjust in Task 3), and a non-empty `vendor`. **Action:** for any `?hang=` page that returns 0 links, correct that brand's `brandSlug`/`url` in `config.ts`. Do not proceed until all four categories yield links + valid JSON.

- [ ] **Step 3: Commit (only if config changed)**

```bash
git add apps/api/scripts/crawler/inspect.ts apps/api/scripts/crawler/config.ts
git commit -m "feat(crawler): add discovery inspector and confirm GearVN selectors/brands"
```

---

## Task 3: Pure transformers (TDD)

**Files:**
- Test: `apps/api/scripts/crawler/transformers.spec.ts`
- Create: `apps/api/scripts/crawler/transformers.ts`

**Interfaces:**
- Consumes: `types.ts`, `config.ts` (`PLACEHOLDER_OPTION_NAMES`, `PLACEHOLDER_OPTION_VALUES`, `LIMITS`).
- Produces:
  - `slugify(text: string): string`
  - `parsePrice(text: string): number`
  - `stripHtml(html: string): string`
  - `buildSku(brandSlug: string, productSlug: string, index: number): string`
  - `isPlaceholderOption(name: string, value: string): boolean`
  - `normalizeSpecs(rows: RawSpecRow[]): TransformedSpec[]`
  - `toTransformedProduct(raw: RawProduct): TransformedProduct | null` (null when no title or no variants)

- [ ] **Step 1: Write the failing tests**

Create `apps/api/scripts/crawler/transformers.spec.ts`:
```ts
import {
  slugify, parsePrice, stripHtml, buildSku, isPlaceholderOption,
  normalizeSpecs, toTransformedProduct,
} from './transformers';
import { RawProduct } from './types';

describe('slugify', () => {
  it('lowercases, strips Vietnamese diacritics and đ', () => {
    expect(slugify('Bàn Phím AKKO 3068B')).toBe('ban-phim-akko-3068b');
    expect(slugify('Chuột Logitech G502')).toBe('chuot-logitech-g502');
  });
  it('collapses spaces/symbols to single hyphens', () => {
    expect(slugify('  Sony  WH-1000XM5!! ')).toBe('sony-wh-1000xm5');
  });
});

describe('parsePrice', () => {
  it('parses VND strings and numbers', () => {
    expect(parsePrice('1.990.000₫')).toBe(1990000);
    expect(parsePrice('8.490.000 đ')).toBe(8490000);
  });
  it('returns 0 for empty/garbage', () => {
    expect(parsePrice('')).toBe(0);
    expect(parsePrice('Liên hệ')).toBe(0);
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Chuột <b>gaming</b></p>\n<div>25K DPI</div>')).toBe('Chuột gaming 25K DPI');
  });
});

describe('buildSku', () => {
  it('joins brand, product slug and index, uppercased', () => {
    expect(buildSku('logitech', 'chuot-logitech-g502', 0)).toBe('LOGITECH-CHUOT-LOGITECH-G502-0');
  });
});

describe('isPlaceholderOption', () => {
  it('detects Haravan default single-variant placeholders', () => {
    expect(isPlaceholderOption('Title', 'Default Title')).toBe(true);
    expect(isPlaceholderOption('Tiêu đề', 'Tiêu đề mặc định')).toBe(true);
    expect(isPlaceholderOption('Switch', 'Blue')).toBe(false);
  });
});

describe('normalizeSpecs', () => {
  it('assigns sortOrder and preserves group', () => {
    expect(normalizeSpecs([{ name: 'DPI', value: '25600' }])).toEqual([
      { group: null, name: 'DPI', value: '25600', sortOrder: 0 },
    ]);
  });
});

const baseRaw: RawProduct = {
  categoryKey: 'ban-phim',
  brandName: 'Akko',
  sourceUrl: 'https://gearvn.com/products/ban-phim-co-akko-3068b',
  title: 'Bàn phím cơ AKKO 3068B',
  descriptionHtml: '<p>Bàn phím <b>không dây</b></p>',
  imageUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
  specs: [{ name: 'Kết nối', value: 'Bluetooth' }],
  inStock: true,
  variants: [
    { title: 'Blue Switch', sku: 'AKKO-3068B-BLUE', price: 1690000, compareAtPrice: 1990000, available: true, options: [{ name: 'Switch', value: 'Blue' }] },
    { title: 'Red Switch', sku: 'AKKO-3068B-RED', price: 1690000, compareAtPrice: null, available: false, options: [{ name: 'Switch', value: 'Red' }] },
  ],
};

describe('toTransformedProduct (multi-variant)', () => {
  it('maps product, images, option types and variants; slug is lowercase', () => {
    const p = toTransformedProduct(baseRaw)!;
    expect(p.slug).toBe('ban-phim-co-akko-3068b');
    expect(p.brandName).toBe('Akko');
    expect(p.categoryName).toBe('Bàn phím');
    expect(p.shortDescription).toBe('Bàn phím không dây');
    expect(p.basePrice).toBe(1990000);            // default variant compare-at
    expect(p.salePrice).toBe(1690000);            // default variant price
    expect(p.images[0].isPrimary).toBe(true);
    expect(p.optionTypes).toEqual([{ name: 'Switch', values: ['Blue', 'Red'], sortOrder: 0 }]);
    expect(p.variants).toHaveLength(2);
    expect(p.variants[0].isDefault).toBe(true);
    expect(p.variants[0].sku).toBe('AKKO-3068B-BLUE');
    expect(p.variants[1].stockAvailable).toBe(0); // unavailable variant
    expect(JSON.parse(p.variants[0].attributesJson)).toEqual({ Switch: 'Blue' });
  });

  it('collapses a placeholder single variant into one default "Mặc định" with no option types', () => {
    const raw: RawProduct = {
      ...baseRaw,
      variants: [{ title: 'Default Title', sku: '', price: 990000, compareAtPrice: null, available: true, options: [{ name: 'Title', value: 'Default Title' }] }],
    };
    const p = toTransformedProduct(raw)!;
    expect(p.optionTypes).toEqual([]);
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].name).toBe('Mặc định');
    expect(p.variants[0].isDefault).toBe(true);
    expect(p.variants[0].options).toEqual([]);
    expect(p.variants[0].sku).toBe('AKKO-BAN-PHIM-CO-AKKO-3068B-0'); // synthesized when raw sku empty
    expect(p.basePrice).toBe(990000);
    expect(p.salePrice).toBeNull();
  });

  it('returns null when there are no variants', () => {
    expect(toTransformedProduct({ ...baseRaw, variants: [] })).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
```
Expected: FAIL — cannot find module `./transformers`.

- [ ] **Step 3: Implement the transformers**

Create `apps/api/scripts/crawler/transformers.ts`:
```ts
import { CATEGORIES, LIMITS, PLACEHOLDER_OPTION_NAMES, PLACEHOLDER_OPTION_VALUES } from './config';
import {
  RawProduct, RawSpecRow, RawVariant, TransformedOptionType,
  TransformedProduct, TransformedSpec, TransformedVariant,
} from './types';

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parsePrice(text: string): number {
  if (!text) return 0;
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildSku(brandSlug: string, productSlug: string, index: number): string {
  return `${brandSlug}-${productSlug}-${index}`.toUpperCase();
}

export function isPlaceholderOption(name: string, value: string): boolean {
  return (
    PLACEHOLDER_OPTION_NAMES.includes(name.trim().toLowerCase()) ||
    PLACEHOLDER_OPTION_VALUES.includes(value.trim().toLowerCase())
  );
}

export function normalizeSpecs(rows: RawSpecRow[]): TransformedSpec[] {
  return rows.map((r, i) => ({ group: r.group ?? null, name: r.name, value: r.value, sortOrder: i }));
}

function realOptions(v: RawVariant): { name: string; value: string }[] {
  return v.options.filter((o) => !isPlaceholderOption(o.name, o.value));
}

function buildOptionTypes(variants: RawVariant[]): TransformedOptionType[] {
  const byName = new Map<string, Set<string>>();
  const order: string[] = [];
  for (const v of variants) {
    for (const o of realOptions(v)) {
      if (!byName.has(o.name)) { byName.set(o.name, new Set()); order.push(o.name); }
      byName.get(o.name)!.add(o.value);
    }
  }
  return order.map((name, i) => ({ name, values: [...byName.get(name)!], sortOrder: i }));
}

export function toTransformedProduct(raw: RawProduct): TransformedProduct | null {
  if (!raw.title || raw.variants.length === 0) return null;

  const category = CATEGORIES.find((c) => c.key === raw.categoryKey);
  if (!category) return null;

  const brandName = raw.brandName.trim();
  const brandSlug = slugify(brandName);
  const slug = slugify(raw.title);
  const optionTypes = buildOptionTypes(raw.variants);

  const def = raw.variants.find((v) => v.available) ?? raw.variants[0];
  const defBase = def.compareAtPrice && def.compareAtPrice > def.price ? def.compareAtPrice : def.price;
  const defSale = def.compareAtPrice && def.compareAtPrice > def.price ? def.price : null;

  const variants: TransformedVariant[] = raw.variants.map((v, i) => {
    const opts = realOptions(v);
    const attrs: Record<string, string> = {};
    for (const o of opts) attrs[o.name] = o.value;
    return {
      sku: v.sku && v.sku.trim() ? v.sku.trim() : buildSku(brandSlug, slug, i),
      name: opts.length ? v.title : 'Mặc định',
      price: v.price,
      stockTotal: 50,
      stockAvailable: v.available ? 50 : 0,
      isDefault: v === def,
      attributesJson: JSON.stringify(attrs),
      options: opts.map((o) => ({ typeName: o.name, value: o.value })),
      displayOrder: i,
    };
  });

  const shortText = stripHtml(raw.descriptionHtml).slice(0, 500);

  return {
    categoryKey: raw.categoryKey,
    categoryName: category.name,
    brandName,
    brandSlug,
    name: raw.title,
    slug,
    shortDescription: shortText || null,
    descriptionHtml: raw.descriptionHtml || null,
    basePrice: defBase,
    salePrice: defSale,
    specificationsJson: JSON.stringify(normalizeSpecs(raw.specs)),
    isActive: true,
    images: raw.imageUrls.slice(0, LIMITS.maxImagesPerProduct).map((url, i) => ({
      url, publicId: '', alt: raw.title, isPrimary: i === 0, sortOrder: i,
    })),
    specs: normalizeSpecs(raw.specs),
    optionTypes,
    variants,
  };
}
```
Note: `publicId` is set to `''` here and filled by the uploader (Task 4). The seeder (Task 6) rejects any image with an empty `publicId`, so a full crawl always uploads first.

- [ ] **Step 4: Run tests to verify they pass**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
```
Expected: PASS — all `transformers.spec.ts` tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/scripts/crawler/transformers.ts apps/api/scripts/crawler/transformers.spec.ts
git commit -m "feat(crawler): tested transformers with multi-variant + option-type mapping"
```

---

## Task 4: GearVN crawler (Haravan JSON + DOM fallback)

**Files:**
- Create: `apps/api/scripts/crawler/gearvn.crawler.ts`

**Interfaces:**
- Consumes: `config.ts` (`SELECTORS`), `types.ts` (`RawProduct`, `RawVariant`, `CategoryKey`), `transformers.ts` (`parsePrice`).
- Produces:
  - `crawlBrandListing(page: Page, url: string, limit: number): Promise<string[]>`
  - `fetchProductJson(page: Page, productUrl: string): Promise<any | null>`
  - `crawlProductDetail(page: Page, url: string, categoryKey: CategoryKey, fallbackBrand: string): Promise<RawProduct | null>`

- [ ] **Step 1: Implement the crawler**

Create `apps/api/scripts/crawler/gearvn.crawler.ts`:
```ts
import { Page } from 'playwright';
import { SELECTORS } from './config';
import { CategoryKey, RawProduct, RawSpecRow, RawVariant } from './types';

/** Collect up to `limit` product detail URLs from a (brand-filtered) listing page. */
export async function crawlBrandListing(page: Page, url: string, limit: number): Promise<string[]> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  const urls = await page.$$eval(SELECTORS.productLink, (as) =>
    Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).href.split('?')[0])))
      .filter((h) => h.includes('/products/')));
  return urls.slice(0, limit);
}

/** Fetch the Haravan product JSON (`{url}.json`). Returns the product object or null. */
export async function fetchProductJson(page: Page, productUrl: string): Promise<any | null> {
  const jsonUrl = productUrl.split('?')[0].replace(/\/$/, '') + '.json';
  try {
    const resp = await page.context().request.get(jsonUrl, { timeout: 30000 });
    if (!resp.ok()) return null;
    const body = await resp.json();
    return body.product ?? body ?? null;
  } catch {
    return null;
  }
}

/** Best-effort spec extraction from the rendered product DOM (may be empty). */
async function scrapeSpecs(page: Page): Promise<RawSpecRow[]> {
  return page
    .$$eval(SELECTORS.specRow, (rows) =>
      rows
        .map((r) => Array.from(r.querySelectorAll('td, th')).map((c) => (c.textContent ?? '').trim()))
        .filter((cells) => cells.length >= 2 && cells[0] && cells[1])
        .map((cells) => ({ name: cells[0], value: cells[1] })))
    .catch(() => [] as RawSpecRow[]);
}

/** Crawl one product: JSON for core/variants/images, DOM for specs. */
export async function crawlProductDetail(
  page: Page,
  url: string,
  categoryKey: CategoryKey,
  fallbackBrand: string,
): Promise<RawProduct | null> {
  const json = await fetchProductJson(page, url);
  if (!json || !json.title) return null;

  const variants: RawVariant[] = (json.variants ?? []).map((v: any) => {
    const optionNames: string[] = (json.options ?? []).map((o: any) => o.name);
    const optionVals = [v.option1, v.option2, v.option3];
    const options = optionNames
      .map((name, i) => ({ name, value: (optionVals[i] ?? '').toString() }))
      .filter((o) => o.value);
    return {
      title: (v.title ?? '').toString(),
      sku: (v.sku ?? '').toString(),
      price: Number(v.price ?? 0),                       // Haravan VND (confirm in Task 2)
      compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
      available: v.available !== false,
      options,
      imageUrl: v.featured_image?.src,
    };
  });
  if (variants.length === 0) return null;

  const imageUrls: string[] = (json.images ?? [])
    .map((img: any) => (typeof img === 'string' ? img : img.src))
    .filter((s: any) => typeof s === 'string' && s.startsWith('http'));

  // DOM specs require a page visit; do it once here.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => undefined);
  const specs = await scrapeSpecs(page);

  return {
    categoryKey,
    brandName: (json.vendor && json.vendor.trim()) || fallbackBrand,
    sourceUrl: url,
    title: json.title.toString(),
    descriptionHtml: (json.body_html ?? '').toString(),
    imageUrls,
    specs,
    variants,
    inStock: variants.some((v) => v.available),
  };
}
```

- [ ] **Step 2: Smoke-verify against one brand (small)**

Run (cwd = `apps/api`):
```bash
npx ts-node -e "import { chromium } from 'playwright'; import { CATEGORIES } from './scripts/crawler/config'; import { crawlBrandListing, crawlProductDetail } from './scripts/crawler/gearvn.crawler'; (async () => { const b = await chromium.launch(); const p = await b.newPage(); const brand = CATEGORIES[0].brands[0]; const urls = await crawlBrandListing(p, brand.url, 2); console.log('urls', urls); const d = await crawlProductDetail(p, urls[0], CATEGORIES[0].key, brand.brandName); console.log(JSON.stringify({ title: d?.title, brand: d?.brandName, variants: d?.variants.length, images: d?.imageUrls.length, price: d?.variants[0]?.price }, null, 2)); await b.close(); })();"
```
Expected: 2 URLs and a detail object with non-empty `title`, a `brand`, `variants >= 1`, `images >= 1`, and a plausible VND `price`. If empty, revisit Task 2.

- [ ] **Step 3: Commit**

```bash
git add apps/api/scripts/crawler/gearvn.crawler.ts
git commit -m "feat(crawler): GearVN crawler via Haravan JSON with DOM spec fallback"
```

---

## Task 5: Cloudinary uploader (TDD)

**Files:**
- Test: `apps/api/scripts/crawler/uploader.spec.ts`
- Create: `apps/api/scripts/crawler/uploader.ts`

**Interfaces:**
- Consumes: `types.ts` (`TransformedImage`), env (`SKIP_UPLOAD`, `CLOUDINARY_*`).
- Produces:
  - `interface UploaderDeps { skip: boolean; upload: (url: string, folder: string) => Promise<{ url: string; publicId: string }> }`
  - `uploadImages(images: TransformedImage[], folder: string, deps?: UploaderDeps): Promise<TransformedImage[]>`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/scripts/crawler/uploader.spec.ts`:
```ts
import { uploadImages, UploaderDeps } from './uploader';
import { TransformedImage } from './types';

const imgs: TransformedImage[] = [
  { url: 'https://cdn/a.jpg', publicId: '', alt: 'x', isPrimary: true, sortOrder: 0 },
  { url: 'https://cdn/b.jpg', publicId: '', alt: 'x', isPrimary: false, sortOrder: 1 },
];

describe('uploadImages', () => {
  it('uploads each image and fills url + publicId', async () => {
    const deps: UploaderDeps = {
      skip: false,
      upload: async (url, folder) => ({ url: `https://res.cloudinary.com/${folder}/x`, publicId: `${folder}/${url.slice(-5)}` }),
    };
    const out = await uploadImages(imgs, 'apexgear/products/chuot/logitech', deps);
    expect(out).toHaveLength(2);
    expect(out[0].url).toContain('res.cloudinary.com');
    expect(out[0].publicId).toContain('apexgear/products/chuot/logitech');
    expect(out[0].isPrimary).toBe(true); // metadata preserved
  });

  it('when skip=true, drops images (no publicId) so seeder skips them', async () => {
    const deps: UploaderDeps = { skip: true, upload: async () => { throw new Error('should not call'); } };
    expect(await uploadImages(imgs, 'f', deps)).toEqual([]);
  });

  it('drops an image whose upload fails but keeps the rest', async () => {
    let n = 0;
    const deps: UploaderDeps = {
      skip: false,
      upload: async (url, folder) => { if (n++ === 0) throw new Error('net'); return { url: 'https://res/y', publicId: `${folder}/y` }; },
    };
    const out = await uploadImages(imgs, 'f', deps);
    expect(out).toHaveLength(1);
    expect(out[0].publicId).toBe('f/y');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
```
Expected: FAIL — cannot find module `./uploader`.

- [ ] **Step 3: Implement the uploader**

Create `apps/api/scripts/crawler/uploader.ts`:
```ts
import { v2 as cloudinary } from 'cloudinary';
import { TransformedImage } from './types';

export interface UploaderDeps {
  skip: boolean;
  upload: (url: string, folder: string) => Promise<{ url: string; publicId: string }>;
}

function defaultDeps(): UploaderDeps {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return {
    skip: process.env.SKIP_UPLOAD === 'true',
    upload: async (url, folder) => {
      const res = await cloudinary.uploader.upload(url, { folder });
      return { url: res.secure_url, publicId: res.public_id };
    },
  };
}

/**
 * Upload each image to Cloudinary under `folder`, returning images with real
 * url + publicId. Images that fail (or all, when skip=true) are dropped — the
 * seeder only writes images that have a publicId.
 */
export async function uploadImages(
  images: TransformedImage[],
  folder: string,
  deps: UploaderDeps = defaultDeps(),
): Promise<TransformedImage[]> {
  if (deps.skip) return [];
  const out: TransformedImage[] = [];
  for (const img of images) {
    try {
      const { url, publicId } = await deps.upload(img.url, folder);
      out.push({ ...img, url, publicId });
    } catch (e) {
      console.warn(`  ⚠ upload failed for ${img.url}: ${(e as Error).message}`);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run to verify it passes**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
```
Expected: PASS — `uploader.spec.ts` + prior specs green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/scripts/crawler/uploader.ts apps/api/scripts/crawler/uploader.spec.ts
git commit -m "feat(crawler): Cloudinary image uploader under apexgear/products/{cat}/{brand}"
```

---

## Task 6: Orchestration with test-crawl mode

**Files:**
- Create: `apps/api/scripts/crawler/index.ts`

**Interfaces:**
- Consumes: `config.ts` (`CATEGORIES`, `LIMITS`, `OUTPUT_DIR`), `gearvn.crawler.ts`, `transformers.ts` (`toTransformedProduct`), `uploader.ts` (`uploadImages`).
- Produces: `output/<categoryKey>.json` per category + combined `output/all-products.json`; in test mode writes `output/_test.json` only.

- [ ] **Step 1: Implement orchestration**

Create `apps/api/scripts/crawler/index.ts`:
```ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { chromium, Page } from 'playwright';
import { CategoryConfig, CATEGORIES, LIMITS, OUTPUT_DIR } from './config';
import { crawlBrandListing, crawlProductDetail } from './gearvn.crawler';
import { toTransformedProduct } from './transformers';
import { uploadImages } from './uploader';
import { TransformedProduct } from './types';

const IS_TEST = process.env.CRAWL_TEST === 'true';

async function crawlOneBrand(page: Page, cat: CategoryConfig, brand: CategoryConfig['brands'][number], limit: number): Promise<TransformedProduct[]> {
  const urls = await crawlBrandListing(page, brand.url, limit);
  console.log(`  ${cat.name}/${brand.brandName}: ${urls.length} urls`);
  const products: TransformedProduct[] = [];
  for (const url of urls) {
    await page.waitForTimeout(LIMITS.requestDelayMs);
    try {
      const raw = await crawlProductDetail(page, url, cat.key, brand.brandName);
      if (!raw) { console.log(`    skip (no data): ${url}`); continue; }
      const product = toTransformedProduct(raw);
      if (!product) { console.log(`    skip (no variants): ${raw.title}`); continue; }
      const folder = `apexgear/products/${cat.key}/${product.brandSlug}`;
      product.images = await uploadImages(product.images, folder);
      products.push(product);
      console.log(`    ✓ ${product.brandName} — ${product.name} (${product.variants.length} variant, ${product.images.length} img)`);
    } catch (e) {
      console.log(`    ✗ ${url}: ${(e as Error).message}`);
    }
  }
  // de-dup by slug within the brand
  return [...new Map(products.map((p) => [p.slug, p])).values()];
}

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  if (IS_TEST) {
    const cat = CATEGORIES[0];
    const brand = cat.brands[0];
    console.log(`\n=== TEST CRAWL: ${cat.name} / ${brand.brandName} (2 products) ===`);
    const products = await crawlOneBrand(page, cat, brand, 2);
    fs.writeFileSync(path.join(OUTPUT_DIR, '_test.json'), JSON.stringify(products, null, 2), 'utf-8');
    await browser.close();
    console.log(`\n🧪 Test crawl wrote ${products.length} product(s) -> output/_test.json`);
    if (products.length === 0) { console.error('Test crawl produced 0 products — fix config/selectors before full crawl.'); process.exit(1); }
    return;
  }

  const all: TransformedProduct[] = [];
  for (const cat of CATEGORIES) {
    console.log(`\n=== ${cat.name} ===`);
    const catProducts: TransformedProduct[] = [];
    for (const brand of cat.brands) {
      catProducts.push(...await crawlOneBrand(page, cat, brand, LIMITS.maxProductsPerBrand));
    }
    const deduped = [...new Map(catProducts.map((p) => [p.slug, p])).values()];
    fs.writeFileSync(path.join(OUTPUT_DIR, `${cat.key}.json`), JSON.stringify(deduped, null, 2), 'utf-8');
    all.push(...deduped);
    console.log(`  wrote ${deduped.length} products -> ${cat.key}.json`);
  }
  const globalDeduped = [...new Map(all.map((p) => [p.slug, p])).values()];
  fs.writeFileSync(path.join(OUTPUT_DIR, 'all-products.json'), JSON.stringify(globalDeduped, null, 2), 'utf-8');
  await browser.close();
  console.log(`\n🎉 Crawl complete: ${globalDeduped.length} unique products.`);
}

run().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the TEST crawl first (proves extraction + upload end-to-end)**

Run (cwd = `apps/api`, needs `CLOUDINARY_*` in `.env`):
```bash
npm run crawl:test
npx ts-node -e "const a=require('./scripts/crawler/output/_test.json'); console.log('count', a.length); console.log(JSON.stringify(a[0], null, 2).slice(0, 900));"
```
Expected: exits 0 with "Test crawl wrote N product(s)" where N ≥ 1; the sample has `name`, `brandName`, `basePrice`, `variants[]`, and `images[]` whose `url` contains `res.cloudinary.com` and a non-empty `publicId`. If N = 0 or images lack `publicId`, fix before proceeding (do NOT run the full crawl).

- [ ] **Step 3: Run the full crawl (demo volume)**

Run (cwd = `apps/api`):
```bash
npm run crawl
ls scripts/crawler/output
npx ts-node -e "const a=require('./scripts/crawler/output/all-products.json'); console.log('total', a.length); console.log('per-cat', a.reduce((m,p)=>{m[p.categoryKey]=(m[p.categoryKey]||0)+1;return m;},{}));"
```
Expected: `all-products.json` + four `<categoryKey>.json`; `total` roughly 60–100 (4 cats × 4 brands × 5–6); each category present with a non-zero count. If any category is 0, revisit its brand URLs (Task 2).

- [ ] **Step 4: Commit**

```bash
git add apps/api/scripts/crawler/index.ts
git commit -m "feat(crawler): orchestrate test + full crawl with Cloudinary upload"
```

---

## Task 7: Seed crawled data into the DB (TDD for the mapper)

**Files:**
- Test: `apps/api/scripts/crawler/seed-crawled.spec.ts`
- Create: `apps/api/scripts/crawler/seed-crawled.ts`

**Interfaces:**
- Consumes: `types.ts` (`TransformedProduct`), `@prisma/client`, `transformers.ts` (`slugify`), `output/all-products.json`.
- Produces:
  - `interface SeedPlan { brands: { name: string; slug: string }[]; categories: { name: string; slug: string }[]; products: TransformedProduct[] }`
  - `buildSeedOperations(products: TransformedProduct[]): SeedPlan`
  - `seedCrawled(): Promise<void>`

- [ ] **Step 1: Write the failing test for the pure mapper**

Create `apps/api/scripts/crawler/seed-crawled.spec.ts`:
```ts
import { buildSeedOperations } from './seed-crawled';
import { TransformedProduct } from './types';

function make(slug: string, brand: string, catName: string, catKey: any): TransformedProduct {
  return {
    categoryKey: catKey, categoryName: catName, brandName: brand, brandSlug: brand.toLowerCase(),
    name: slug, slug, shortDescription: null, descriptionHtml: null, basePrice: 1000, salePrice: null,
    specificationsJson: '[]', isActive: true, images: [], specs: [], optionTypes: [],
    variants: [{ sku: `${brand}-${slug}-0`.toUpperCase(), name: 'Mặc định', price: 1000, stockTotal: 50, stockAvailable: 50, isDefault: true, attributesJson: '{}', options: [], displayOrder: 0 }],
  };
}

describe('buildSeedOperations', () => {
  it('de-dups brands and categories referenced by products', () => {
    const plan = buildSeedOperations([
      make('a', 'Logitech', 'Chuột', 'chuot'),
      make('b', 'Logitech', 'Chuột', 'chuot'),
      make('c', 'Razer', 'Bàn phím', 'ban-phim'),
    ]);
    expect(plan.brands).toHaveLength(2);
    expect(plan.categories).toHaveLength(2);
    expect(plan.products).toHaveLength(3);
    expect(plan.brands.map((b) => b.name).sort()).toEqual(['Logitech', 'Razer']);
    expect(plan.categories.map((c) => c.slug).sort()).toEqual(['ban-phim', 'chuot']);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
```
Expected: FAIL — cannot find module `./seed-crawled`.

- [ ] **Step 3: Implement the seeder**

Create `apps/api/scripts/crawler/seed-crawled.ts`:
```ts
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

export async function seedCrawled(): Promise<void> {
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
        await prisma.productSpec.createMany({ data: p.specs.map((s) => ({ productId: product.id, group: s.group, name: s.name, value: s.value, sortOrder: s.sortOrder })) });
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
```
Note: the composite `where` keys (`productId_name`, `optionTypeId_value`, `variantId_optionValueId`) are Prisma's generated names for the `@@unique` constraints in `schema.prisma` — they exist as-is.

- [ ] **Step 4: Run unit test to verify it passes**

Run (cwd = `apps/api`):
```bash
npm run test:crawler
```
Expected: PASS — `buildSeedOperations` test green (plus prior specs).

- [ ] **Step 5: Seed the demo DB and verify (idempotency)**

Run (cwd = `apps/api`, needs `DATABASE_URL`):
```bash
npm run seed:crawled
npx ts-node -e "import 'dotenv/config'; import { PrismaClient } from '@prisma/client'; (async()=>{const p=new PrismaClient(); console.log('products', await p.product.count()); console.log('variants', await p.productVariant.count()); console.log('images', await p.productImage.count()); console.log('optionTypes', await p.productOptionType.count()); await p.\$disconnect();})();"
```
Expected: `✓` lines + summary; `products > 0`, `variants >= products`, `images > 0`. Re-run `npm run seed:crawled` and confirm counts do **not** increase.

- [ ] **Step 6: Commit**

```bash
git add apps/api/scripts/crawler/seed-crawled.ts apps/api/scripts/crawler/seed-crawled.spec.ts
git commit -m "feat(crawler): idempotent seed of products, variants, options, images"
```

---

## Task 8: Docs, regression & phase close-out

**Files:**
- Create: `apps/api/scripts/crawler/README.md`
- Modify: `ApexGear.md` (mark Data Crawler done — only if a status/checklist section exists; else skip)

**Interfaces:** consumes everything above; produces docs + verification only.

- [ ] **Step 1: Write the crawler README**

Create `apps/api/scripts/crawler/README.md`:
```markdown
# GearVN Demo Data Crawler

Crawls a small demo set (4 categories × 4 brands × 5–10 products) from GearVN.com,
uploads images to Cloudinary, and seeds the ApexGear DB. Local/demo use only —
low volume, sequential, polite delays.

## Prerequisites (apps/api/.env)
- `DATABASE_URL` (reachable SQL Server)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Chromium: `npx playwright install chromium`

## Usage (cwd = apps/api)
1. `npm run crawl:inspect -- "<brandCollectionUrl>"` — confirm links/`?hang=` values/JSON shape.
2. `npm run crawl:test` — TEST crawl (1 brand × 2 products) proving extraction + upload.
3. `npm run crawl` — full demo crawl → `scripts/crawler/output/*.json`.
4. `npm run seed:crawled` — idempotent upsert into the DB.
5. `npm run test:crawler` — crawler unit tests.

## Knobs (env)
- `MAX_PRODUCTS_PER_BRAND` (default 6, clamped 5–10)
- `MAX_IMAGES_PER_PRODUCT` (default 4)
- `REQUEST_DELAY_MS` (default 800)
- `SKIP_UPLOAD=true` — offline unit runs only (produces no DB images)

## Notes
- Categories/brands + selectors live in `config.ts`; `vendor` from Haravan JSON is
  the authoritative brand name. Cloudinary folder: `apexgear/products/{category}/{brand}/`.
- Every product seeds ≥1 variant (one `isDefault`) so cart/checkout work; real
  option types/variants are seeded when the product has them.
```

- [ ] **Step 2: Full regression — api unit suite must stay green**

Run (cwd = `apps/api`):
```bash
npm test
npm run test:crawler
npx tsc --noEmit -p tsconfig.json
```
Expected: the 154-test api suite passes unchanged (crawler tests excluded by config); `test:crawler` passes; `tsc --noEmit` clean.

- [ ] **Step 3: Commit**

```bash
git add apps/api/scripts/crawler/README.md ApexGear.md
git commit -m "docs(crawler): usage README and phase close-out"
```

- [ ] **Step 4: Confirm branch layout**

Run:
```bash
git -C "E:/SourceCode/ApexGear" branch
git -C "E:/SourceCode/ApexGear" log --oneline -10
```
Expected: `main` and `feat/crawler` both listed; `feat/crawler` holds the incremental commits from this plan. Do **not** merge to `main` unless the user asks.

---

## Self-Review

**1. Spec + correction coverage:**
- 4 categories with corrected URLs; 3 via `?hang=<brand>`, monitor via 4 explicit collections → `config.ts` (Task 1), verified (Task 2). ✅
- Exactly 4 brands/category, 5–10 products/brand (clamped default 6) → `CATEGORIES` + `LIMITS`. ✅
- Crawl into product detail pages → `crawlProductDetail` via Haravan JSON + DOM (Task 4). ✅
- **Crawl real variants** → `RawVariant`/`TransformedVariant` arrays, option types, seeded as `ProductVariant` + `ProductOptionType`/`Value`/`VariantOption` (Tasks 3, 4, 7). ✅
- **Cloudinary required**, folder `apexgear/products/{cat}/{brand}/`, only `.env` needed → `uploader.ts` (Task 5), wired in orchestration (Task 6). ✅
- **Test crawl before full** → `CRAWL_TEST` mode + `npm run crawl:test` (Task 6, Step 2) + smoke checks (Tasks 2, 4). ✅
- **Lowercase slugs** → `slugify` + explicit test (Task 3). ✅
- Data per product (name, price+sale, images, rich desc, specs, brand, category, stock) → `RawProduct`/`TransformedProduct`; description mapped to `Product.description`. ✅
- Branch `feat/crawler` sibling to `main`, no worktree, small incremental commits → Task 1 Step 1 + per-task commits. ✅

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N". Every code step shows full code; selector/endpoint uncertainty handled by the explicit inspect task, not placeholders. ✅

**3. Type consistency:** `RawProduct`/`RawVariant`/`TransformedProduct`/`TransformedVariant`/`TransformedOptionType`/`TransformedImage`/`TransformedSpec`/`CategoryKey` defined in Task 1, used with matching fields in Tasks 3–7. Function names (`crawlBrandListing`, `fetchProductJson`, `crawlProductDetail`, `toTransformedProduct`, `uploadImages`, `buildSeedOperations`, `seedCrawled`, `slugify`, `parsePrice`, `stripHtml`, `buildSku`, `isPlaceholderOption`, `normalizeSpecs`) consistent between producing and consuming tasks. `UploaderDeps`/`SeedPlan` match their tests. Prisma composite-unique `where` keys match `schema.prisma` `@@unique` definitions. ✅
