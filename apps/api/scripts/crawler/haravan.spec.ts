import { buildRawVariants, extractImageUrls, buildRawProduct } from './haravan';

const product = {
  title: 'Bàn phím cơ AKKO 3068B',
  vendor: 'Akko',
  body_html: '<p>Bàn phím <b>không dây</b></p>',
  options: [{ name: 'Switch' }],
  variants: [
    { title: 'Blue Switch', sku: 'AKKO-BLUE', price: 1690000, compare_at_price: 1990000, available: true, option1: 'Blue', featured_image: { src: 'https://cdn/blue.jpg' } },
    { title: 'Red Switch', sku: 'AKKO-RED', price: 1690000, compare_at_price: '0', available: false, option1: 'Red' },
  ],
  images: [{ src: 'https://cdn/a.jpg' }, { src: 'https://cdn/b.jpg' }, 'https://cdn/c.jpg', 'not-a-url'],
};

describe('buildRawVariants', () => {
  it('maps Haravan variants with VND prices and option name/value pairs', () => {
    const variants = buildRawVariants(product);
    expect(variants).toHaveLength(2);
    expect(variants[0]).toMatchObject({ title: 'Blue Switch', sku: 'AKKO-BLUE', price: 1690000, compareAtPrice: 1990000, available: true, imageUrl: 'https://cdn/blue.jpg' });
    expect(variants[0].options).toEqual([{ name: 'Switch', value: 'Blue' }]);
  });
  it('coerces "0"/empty compare_at_price to null and defaults available true', () => {
    const variants = buildRawVariants(product);
    expect(variants[1].compareAtPrice).toBeNull();
    expect(variants[1].available).toBe(false);
  });
  it('returns [] for a product with no variants', () => {
    expect(buildRawVariants({ options: [], variants: [] })).toEqual([]);
  });
});

describe('extractImageUrls', () => {
  it('accepts {src} and string entries, drops non-http, keeps order', () => {
    expect(extractImageUrls(product)).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg']);
  });
});

describe('buildRawProduct', () => {
  it('assembles a RawProduct using vendor as brand and provided specs/images', () => {
    const specs = [{ name: 'Kết nối', value: 'Bluetooth' }];
    const raw = buildRawProduct({ ...product, __sourceUrl: 'https://gearvn.com/products/akko-3068b' }, 'ban-phim', 'FallbackBrand', specs, ['https://cdn/only.jpg'])!;
    expect(raw.brandName).toBe('Akko');
    expect(raw.sourceUrl).toBe('https://gearvn.com/products/akko-3068b');
    expect(raw.imageUrls).toEqual(['https://cdn/only.jpg']); // provided override wins
    expect(raw.specs).toBe(specs);
    expect(raw.variants).toHaveLength(2);
    expect(raw.inStock).toBe(true); // at least one available
  });
  it('falls back to the configured brand when vendor is missing', () => {
    const raw = buildRawProduct({ ...product, vendor: '' }, 'ban-phim', 'FallbackBrand', [])!;
    expect(raw.brandName).toBe('FallbackBrand');
    expect(raw.imageUrls).toEqual(['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg']); // derived from product
  });
  it('returns null for missing title or no variants', () => {
    expect(buildRawProduct({ variants: [{}] }, 'ban-phim', 'X', [])).toBeNull();
    expect(buildRawProduct({ title: 'X', options: [], variants: [] }, 'ban-phim', 'X', [])).toBeNull();
  });
});
