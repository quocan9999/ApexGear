/**
 * TIER 2 — `gearvn_raw` → `apexgear` (transform / clean / map / load).
 *
 * Reads the raw products of the latest completed crawl run, reconstructs a typed
 * RawProduct from the stored Haravan JSON + DOM specs, cleans/maps them into the
 * production shape (VND prices, lowercase slugs, placeholder-variant → default,
 * spec normalization), uploads images to Cloudinary, and idempotently upserts
 * into the `apexgear` DB.
 *
 *   npm run raw:transform            # transform latest completed run
 *   npm run raw:transform -- <runId> # transform a specific run
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { RawStore } from './raw-store';
import { buildRawProduct } from './haravan';
import { toTransformedProduct } from './transformers';
import { uploadImages } from './uploader';
import { upsertProducts } from './seed-crawled';
import { CategoryKey, RawProductRow, RawSpecRow, TransformedProduct } from './types';

/** Rebuild a typed RawProduct from one stored raw row (verbatim JSON columns). */
function rawRowToRawProduct(row: RawProductRow) {
  let product: any = null;
  try { product = JSON.parse(row.haravanJson); } catch { return null; }
  if (product && typeof product === 'object') product.__sourceUrl = row.sourceUrl;

  let specs: RawSpecRow[] = [];
  try { specs = JSON.parse(row.specsJson) ?? []; } catch { specs = []; }

  let imageUrls: string[] = [];
  try { imageUrls = JSON.parse(row.imageUrlsJson) ?? []; } catch { imageUrls = []; }

  return buildRawProduct(product, row.categoryKey as CategoryKey, row.brandName, specs, imageUrls);
}

async function run() {
  const argRunId = process.argv[2];
  const store = new RawStore();
  const apex = new PrismaClient();

  try {
    const runId = argRunId ?? (await store.latestCompletedRunId());
    if (!runId) {
      console.error('No completed crawl run found. Run `npm run crawl:raw` first.');
      process.exitCode = 1;
      return;
    }
    console.log(`\n=== Transform run ${runId} → apexgear ===`);

    const rows = await store.productsForRun(runId);
    console.log(`  ${rows.length} raw product(s) to transform`);

    const products: TransformedProduct[] = [];
    for (const row of rows) {
      const raw = rawRowToRawProduct(row);
      if (!raw) { console.log(`    skip (bad raw JSON): ${row.title}`); continue; }
      const product = toTransformedProduct(raw);
      if (!product) { console.log(`    skip (no variants): ${raw.title}`); continue; }
      const folder = `apexgear/products/${product.categoryKey}/${product.brandSlug}`;
      product.images = await uploadImages(product.images, folder);
      products.push(product);
    }

    // De-dup by slug across the whole run (brands can share products).
    const deduped = [...new Map(products.map((p) => [p.slug, p])).values()];
    console.log(`  ${deduped.length} unique product(s) after de-dup — upserting...\n`);

    await upsertProducts(apex, deduped);
  } finally {
    await store.disconnect();
    await apex.$disconnect();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
