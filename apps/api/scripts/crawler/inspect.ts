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
  const browser = await chromium.launch({ headless: true });
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
