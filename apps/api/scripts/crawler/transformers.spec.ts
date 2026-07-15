import {
  slugify, parsePrice, stripHtml, buildSku, isPlaceholderOption,
  normalizeSpecs, toTransformedProduct,
} from './transformers';
import { RawProduct } from './types';

describe('slugify', () => {
  it('lowercases, strips Vietnamese diacritics and đ', () => {
    expect(slugify('Bàn Phím AKKO 3068B')).toBe('ban-phim-akko-3068b');
    expect(slugify('Chuột Logitech G502')).toBe('chuot-logitech-g502');
  });
  it('collapses spaces/symbols to single hyphens', () => {
    expect(slugify('  Sony  WH-1000XM5!! ')).toBe('sony-wh-1000xm5');
  });
});

describe('parsePrice', () => {
  it('parses VND strings and numbers', () => {
    expect(parsePrice('1.990.000₫')).toBe(1990000);
    expect(parsePrice('8.490.000 đ')).toBe(8490000);
  });
  it('returns 0 for empty/garbage', () => {
    expect(parsePrice('')).toBe(0);
    expect(parsePrice('Liên hệ')).toBe(0);
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Chuột <b>gaming</b></p>\n<div>25K DPI</div>')).toBe('Chuột gaming 25K DPI');
  });
});

describe('buildSku', () => {
  it('joins brand, product slug and index, uppercased', () => {
    expect(buildSku('logitech', 'chuot-logitech-g502', 0)).toBe('LOGITECH-CHUOT-LOGITECH-G502-0');
  });
});

describe('isPlaceholderOption', () => {
  it('detects Haravan default single-variant placeholders', () => {
    expect(isPlaceholderOption('Title', 'Default Title')).toBe(true);
    expect(isPlaceholderOption('Tiêu đề', 'Tiêu đề mặc định')).toBe(true);
    expect(isPlaceholderOption('Switch', 'Blue')).toBe(false);
  });
});

describe('normalizeSpecs', () => {
  it('assigns sortOrder and preserves group', () => {
    expect(normalizeSpecs([{ name: 'DPI', value: '25600' }])).toEqual([
      { group: null, name: 'DPI', value: '25600', sortOrder: 0 },
    ]);
  });
});

const baseRaw: RawProduct = {
  categoryKey: 'ban-phim',
  brandName: 'Akko',
  sourceUrl: 'https://gearvn.com/products/ban-phim-co-akko-3068b',
  title: 'Bàn phím cơ AKKO 3068B',
  descriptionHtml: '<p>Bàn phím <b>không dây</b></p>',
  imageUrls: ['https://cdn/a.jpg', 'https://cdn/b.jpg'],
  specs: [{ name: 'Kết nối', value: 'Bluetooth' }],
  inStock: true,
  variants: [
    { title: 'Blue Switch', sku: 'AKKO-3068B-BLUE', price: 1690000, compareAtPrice: 1990000, available: true, options: [{ name: 'Switch', value: 'Blue' }] },
    { title: 'Red Switch', sku: 'AKKO-3068B-RED', price: 1690000, compareAtPrice: null, available: false, options: [{ name: 'Switch', value: 'Red' }] },
  ],
};

describe('toTransformedProduct (multi-variant)', () => {
  it('maps product, images, option types and variants; slug is lowercase', () => {
    const p = toTransformedProduct(baseRaw)!;
    expect(p.slug).toBe('ban-phim-co-akko-3068b');
    expect(p.brandName).toBe('Akko');
    expect(p.categoryName).toBe('Bàn phím');
    expect(p.basePrice).toBe(1990000);            // default variant compare-at
    expect(p.salePrice).toBe(1690000);            // default variant price
    expect(p.images[0].isPrimary).toBe(true);
    expect(p.optionTypes).toEqual([{ name: 'Switch', values: ['Blue', 'Red'], sortOrder: 0 }]);
    expect(p.variants).toHaveLength(2);
    expect(p.variants[0].isDefault).toBe(true);
    expect(p.variants[0].sku).toBe('AKKO-3068B-BLUE');
    expect(p.variants[1].stockAvailable).toBe(0); // unavailable variant
    expect(JSON.parse(p.variants[0].attributesJson)).toEqual({ Switch: 'Blue' });
  });

  it('collapses a placeholder single variant into one default "Mặc định" with no option types', () => {
    const raw: RawProduct = {
      ...baseRaw,
      variants: [{ title: 'Default Title', sku: '', price: 990000, compareAtPrice: null, available: true, options: [{ name: 'Title', value: 'Default Title' }] }],
    };
    const p = toTransformedProduct(raw)!;
    expect(p.optionTypes).toEqual([]);
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].name).toBe('Mặc định');
    expect(p.variants[0].isDefault).toBe(true);
    expect(p.variants[0].options).toEqual([]);
    expect(p.variants[0].sku).toBe('AKKO-BAN-PHIM-CO-AKKO-3068B-0'); // synthesized when raw sku empty
    expect(p.basePrice).toBe(990000);
    expect(p.salePrice).toBeNull();
  });

  it('returns null when there are no variants', () => {
    expect(toTransformedProduct({ ...baseRaw, variants: [] })).toBeNull();
  });
});
