/**
 * TIER 1 — Playwright → `gearvn_raw` (verbatim staging).
 *
 * Visits each product DETAIL page, captures the Haravan product JSON (via the
 * DevTools-Network response listener, DOM specs as fallback) and stores it RAW
 * in the gearvn_raw DB. No cleaning/typing here — that's tier 2 (raw-to-apex).
 *
 *   npm run crawl:raw:test   # 1 category / 1 brand × 2 products, exits 1 if 0
 *   npm run crawl:raw        # all categories/brands, ≤ maxProductsPerBrand each
 *
 * We only capture: brand, name, price (base+sale via variants), variants, images
 * (primary/gallery + description images live in body_html), rich-text description,
 * specs. We do NOT capture related/viewed products, reviews, or tech-news blocks.
 */
import 'dotenv/config';
import { chromium, Page } from 'playwright';
import { CategoryConfig, CATEGORIES, LIMITS } from './config';
import { crawlBrandListing, captureProduct } from './gearvn.crawler';
import { RawStore } from './raw-store';

const IS_TEST = process.env.CRAWL_TEST === 'true';

async function crawlBrandToRaw(
  page: Page,
  store: RawStore,
  runId: string,
  cat: CategoryConfig,
  brand: CategoryConfig['brands'][number],
  limit: number,
): Promise<number> {
  const urls = await crawlBrandListing(page, brand.url, limit);
  console.log(`  ${cat.name}/${brand.brandName}: ${urls.length} urls`);
  const seen = new Set<string>();
  let saved = 0;
  for (const url of urls) {
    await page.waitForTimeout(LIMITS.requestDelayMs);
    try {
      const cap = await captureProduct(page, url, cat.key, brand.brandSlug, brand.brandName);
      if (!cap) { console.log(`    skip (no product JSON): ${url}`); continue; }
      if (seen.has(cap.sourceUrl)) { console.log(`    skip (dup): ${cap.title}`); continue; }
      seen.add(cap.sourceUrl);
      await store.saveProduct(runId, cap);
      saved++;
      const variantCount = safeCount(cap.haravanJson, 'variants');
      const imgCount = safeLen(cap.imageUrlsJson);
      console.log(`    ✓ ${cap.brandName} — ${cap.title} (${variantCount} variant, ${imgCount} img) [raw]`);
    } catch (e) {
      console.log(`    ✗ ${url}: ${(e as Error).message}`);
    }
  }
  return saved;
}

function safeCount(json: string, key: string): number {
  try { return (JSON.parse(json)?.[key] ?? []).length; } catch { return 0; }
}
function safeLen(json: string): number {
  try { return (JSON.parse(json) ?? []).length; } catch { return 0; }
}

async function run() {
  const store = new RawStore();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const runId = await store.startRun(IS_TEST ? 'test' : 'full');
  let total = 0;

  try {
    if (IS_TEST) {
      const cat = CATEGORIES[0];
      const brand = cat.brands[0];
      console.log(`\n=== TEST RAW CRAWL: ${cat.name} / ${brand.brandName} (2 products) ===`);
      total = await crawlBrandToRaw(page, store, runId, cat, brand, 2);
      await store.finishRun(runId, total > 0 ? 'completed' : 'failed', total);
      console.log(`\n🧪 Test raw-crawl stored ${total} product(s) in gearvn_raw (run ${runId}).`);
      if (total === 0) {
        console.error('Test crawl produced 0 products — fix config/selectors before full crawl.');
        process.exitCode = 1;
      }
      return;
    }

    for (const cat of CATEGORIES) {
      console.log(`\n=== ${cat.name} ===`);
      for (const brand of cat.brands) {
        total += await crawlBrandToRaw(page, store, runId, cat, brand, LIMITS.maxProductsPerBrand);
      }
    }
    await store.finishRun(runId, 'completed', total);
    console.log(`\n🎉 Raw crawl complete: ${total} products stored in gearvn_raw (run ${runId}).`);
  } catch (e) {
    await store.finishRun(runId, 'failed', total, (e as Error).message);
    throw e;
  } finally {
    await browser.close();
    await store.disconnect();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
