import { Page } from 'playwright';
import { SELECTORS } from './config';
import { CategoryKey, RawCapture, RawProduct, RawSpecRow, RawVariant } from './types';
import { extractImageUrls } from './haravan';

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

/**
 * Capture a product for the RAW tier: navigate the detail page while listening
 * for the Haravan product JSON response (DevTools-Network approach — more stable
 * than DOM parsing), scrape the spec table, and return everything verbatim as a
 * RawCapture ready to store in `gearvn_raw`. Falls back to `{url}.json` if the
 * page never fires a matching response. Returns null when no product JSON found.
 */
export async function captureProduct(
  page: Page,
  url: string,
  categoryKey: CategoryKey,
  brandSlug: string,
  fallbackBrand: string,
): Promise<RawCapture | null> {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  const handle = cleanUrl.split('/products/')[1]?.split('/')[0] ?? null;

  // Listen for the internal Haravan product JSON that the storefront requests
  // (e.g. `/products/<handle>.json` or a Haravan product API path).
  let captured: any = null;
  const onResponse = async (resp: any) => {
    if (captured) return;
    const rUrl = resp.url();
    if (!/\/products\/[^?]+\.json/.test(rUrl) && !/\/products\.json/.test(rUrl)) return;
    try {
      const body = await resp.json();
      const p = body?.product ?? body;
      if (p && p.title && p.variants) captured = p;
    } catch {
      /* non-JSON or already consumed — ignore */
    }
  };
  page.on('response', onResponse);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
  } finally {
    page.off('response', onResponse);
  }

  // Fallback: explicit JSON fetch if the page didn't emit a usable response.
  if (!captured) captured = await fetchProductJson(page, url);
  if (!captured || !captured.title || !Array.isArray(captured.variants) || captured.variants.length === 0) {
    return null;
  }

  const specs = await scrapeSpecs(page);
  const imageUrls = extractImageUrls(captured);

  return {
    categoryKey,
    brandSlug,
    brandName: (captured.vendor && String(captured.vendor).trim()) || fallbackBrand,
    sourceUrl: cleanUrl,
    handle,
    title: String(captured.title),
    haravanJson: JSON.stringify(captured),
    specsJson: JSON.stringify(specs),
    descriptionHtml: String(captured.body_html ?? ''),
    imageUrlsJson: JSON.stringify(imageUrls),
  };
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
