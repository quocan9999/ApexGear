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

/**
 * Clean GearVN `body_html` into presentable rich text.
 *
 * GearVN auto-prepends a header block (Hãng sản xuất / Tình trạng / Bảo hành),
 * store policies (đổi trả, trả góp MPOS/HDSAISON) and a literal `##` separator
 * before the real marketing content, then embeds a spec table (#tblGeneralAttribute)
 * that duplicates our structured specs. Everything up to `##` is boilerplate, so we
 * cut it; we also drop the embedded spec table, unwrap gearvn.com cross-sell links,
 * and normalize protocol-relative asset URLs so inline images resolve. Idempotent.
 */
export function cleanDescriptionHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  let out = html;

  // 1. Boilerplate (header + store policies) sits before the `##` separator.
  const marker = out.indexOf('##');
  if (marker >= 0) {
    out = out.slice(marker + 2);
    // Drop orphan closing/empty tags left where the cut landed mid-element.
    out = out.replace(/^(?:\s*<\/(?:strong|span|em|b|p|div|h1|h2|h3)>)+/gi, '');
  }

  // 2. Remove the embedded spec table + its heading (duplicates structured specs).
  out = out.replace(
    /<h2[^>]*>(?:<[^>]+>)*\s*Thông số kỹ thuật:?\s*(?:<\/[^>]+>)*<\/h2>/gi,
    '',
  );
  out = out.replace(/<table[^>]*id="tblGeneralAttribute"[\s\S]*?<\/table>/gi, '');

  // 3. Unwrap gearvn.com cross-sell links → keep their text only.
  out = out.replace(/<a\b[^>]*href="[^"]*gearvn\.com[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // 4. Normalize protocol-relative asset URLs (//cdn… → https://cdn…).
  out = out.replace(/(src|href)="\/\//gi, '$1="https://');

  // 5. Drop empty paragraphs/divs/spans left behind.
  out = out.replace(/<(p|div|span)>(?:\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, '');

  out = out.trim();

  // Nothing meaningful left (e.g. body was only header + spec table).
  const text = out.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return text.length >= 20 ? out : null;
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

  return {
    categoryKey: raw.categoryKey,
    categoryName: category.name,
    brandName,
    brandSlug,
    name: raw.title,
    slug,
    descriptionHtml: cleanDescriptionHtml(raw.descriptionHtml),
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
