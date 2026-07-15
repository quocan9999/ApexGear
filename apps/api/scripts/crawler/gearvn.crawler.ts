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
      price: Number(v.price ?? 0),                       // Haravan VND (confirmed in Task 2 — not cents)
      compareAtPrice: Number(v.compare_at_price) || null, // Haravan sends "0"/"" for no-sale; coerce to null
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
