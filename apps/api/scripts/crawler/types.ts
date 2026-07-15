/** One of the four fixed storefront categories (matches prisma/seed.ts). */
export type CategoryKey = 'tai-nghe' | 'man-hinh' | 'chuot' | 'ban-phim';

export interface RawSpecRow { group?: string; name: string; value: string; }

/** A single variant as read from the Haravan product JSON. */
export interface RawVariant {
  title: string;                                  // e.g. "Blue Switch" or "Default Title"
  sku: string;                                    // may be empty
  price: number;                                  // VND
  compareAtPrice: number | null;                  // struck-through price if on sale
  available: boolean;
  options: { name: string; value: string }[];     // option name→value pairs
  imageUrl?: string;
}

/** Raw product exactly as extracted (JSON-first, DOM fallback). */
export interface RawProduct {
  categoryKey: CategoryKey;
  brandName: string;          // authoritative: Haravan `vendor`, else configured brand
  sourceUrl: string;
  title: string;
  descriptionHtml: string;    // Haravan body_html (rich text)
  imageUrls: string[];        // absolute, primary first
  specs: RawSpecRow[];
  variants: RawVariant[];
  inStock: boolean;
}

export interface TransformedImage { url: string; publicId: string; alt: string; isPrimary: boolean; sortOrder: number; }
export interface TransformedSpec { group: string | null; name: string; value: string; sortOrder: number; }
export interface TransformedOptionType { name: string; values: string[]; sortOrder: number; }

export interface TransformedVariant {
  sku: string;
  name: string;
  price: number;
  stockTotal: number;
  stockAvailable: number;
  isDefault: boolean;
  attributesJson: string;                          // JSON of {optionName: value}
  options: { typeName: string; value: string }[];  // empty when product has no real options
  displayOrder: number;
}

/** DB-ready product written to output JSON and consumed by the seeder. */
export interface TransformedProduct {
  categoryKey: CategoryKey;
  categoryName: string;
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  descriptionHtml: string | null;
  basePrice: number;
  salePrice: number | null;
  specificationsJson: string;   // for Product.specifications
  isActive: boolean;
  images: TransformedImage[];
  specs: TransformedSpec[];
  optionTypes: TransformedOptionType[];
  variants: TransformedVariant[];
}

export interface CrawlLimits {
  maxProductsPerBrand: number;
  maxImagesPerProduct: number;
  requestDelayMs: number;
}

/**
 * A single scraped product as tier 1 writes it to the `gearvn_raw` DB — verbatim,
 * no cleaning. All JSON payloads are stored as strings (SQL Server NVarChar(Max)).
 */
export interface RawCapture {
  categoryKey: CategoryKey;
  brandSlug: string;           // configured ?hang= slug (lowercase)
  brandName: string;           // Haravan vendor, else configured brand
  sourceUrl: string;
  handle: string | null;
  title: string;
  haravanJson: string;         // Haravan product object (body.product) as JSON string
  specsJson: string;           // DOM specs [{name,value}] as JSON string
  descriptionHtml: string;     // Haravan body_html (rich text)
  imageUrlsJson: string;       // absolute image URLs, primary first, as JSON string
}

/** A RawProduct row as read back from the raw store in tier 2. */
export interface RawProductRow extends RawCapture {
  id: string;
  runId: string;
  crawledAt: Date;
}
