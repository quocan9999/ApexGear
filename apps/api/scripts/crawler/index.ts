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
