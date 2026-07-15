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
- The listing selector is scoped to `.listProduct-row` so brand-filtered grids are
  read (not the site-wide megamenu/carousel present on every collection page).
- Haravan product prices are already in VND (not cents); `compare_at_price` of
  `"0"`/`""` is coerced to "no sale".
