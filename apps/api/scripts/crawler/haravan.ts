/**
 * Pure Haravan product-object mappers. No Playwright, no DB — just JSON → typed
 * shapes. Shared by the crawler (tier 1) and the raw→apex transform (tier 2) so
 * variant/image parsing is defined exactly once and can be unit-tested.
 */
import { CategoryKey, RawProduct, RawSpecRow, RawVariant } from './types';

/** Build typed variants from a Haravan product object (`body.product`). */
export function buildRawVariants(product: any): RawVariant[] {
  const optionNames: string[] = (product.options ?? []).map((o: any) => o.name);
  return (product.variants ?? []).map((v: any) => {
    const optionVals = [v.option1, v.option2, v.option3];
    const options = optionNames
      .map((name, i) => ({ name, value: (optionVals[i] ?? '').toString() }))
      .filter((o) => o.value);
    return {
      title: (v.title ?? '').toString(),
      sku: (v.sku ?? '').toString(),
      price: Number(v.price ?? 0), // Haravan VND (not cents)
      compareAtPrice: Number(v.compare_at_price) || null, // "0"/"" → null (no sale)
      available: v.available !== false,
      options,
      imageUrl: v.featured_image?.src,
    };
  });
}

/** Absolute image URLs from a Haravan product object, primary first. */
export function extractImageUrls(product: any): string[] {
  return (product.images ?? [])
    .map((img: any) => (typeof img === 'string' ? img : img.src))
    .filter((s: any) => typeof s === 'string' && s.startsWith('http'));
}

/**
 * Assemble a RawProduct from a Haravan product object plus externally supplied
 * DOM specs and image URLs (both may come verbatim from the raw store in tier 2).
 * Returns null when the product has no title or no variants.
 */
export function buildRawProduct(
  product: any,
  categoryKey: CategoryKey,
  fallbackBrand: string,
  specs: RawSpecRow[],
  imageUrls?: string[],
): RawProduct | null {
  if (!product || !product.title) return null;
  const variants = buildRawVariants(product);
  if (variants.length === 0) return null;
  return {
    categoryKey,
    brandName: (product.vendor && String(product.vendor).trim()) || fallbackBrand,
    sourceUrl: product.__sourceUrl ?? '',
    title: String(product.title),
    descriptionHtml: String(product.body_html ?? ''),
    imageUrls: imageUrls ?? extractImageUrls(product),
    specs,
    variants,
    inStock: variants.some((v) => v.available),
  };
}
