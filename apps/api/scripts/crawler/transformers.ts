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
