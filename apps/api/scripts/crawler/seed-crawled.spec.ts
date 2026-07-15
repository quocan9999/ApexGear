import { buildSeedOperations } from './seed-crawled';
import { TransformedProduct } from './types';

function make(slug: string, brand: string, catName: string, catKey: any): TransformedProduct {
  return {
    categoryKey: catKey, categoryName: catName, brandName: brand, brandSlug: brand.toLowerCase(),
    name: slug, slug, shortDescription: null, descriptionHtml: null, basePrice: 1000, salePrice: null,
    specificationsJson: '[]', isActive: true, images: [], specs: [], optionTypes: [],
    variants: [{ sku: `${brand}-${slug}-0`.toUpperCase(), name: 'Mặc định', price: 1000, stockTotal: 50, stockAvailable: 50, isDefault: true, attributesJson: '{}', options: [], displayOrder: 0 }],
  };
}

describe('buildSeedOperations', () => {
  it('de-dups brands and categories referenced by products', () => {
    const plan = buildSeedOperations([
      make('a', 'Logitech', 'Chuột', 'chuot'),
      make('b', 'Logitech', 'Chuột', 'chuot'),
      make('c', 'Razer', 'Bàn phím', 'ban-phim'),
    ]);
    expect(plan.brands).toHaveLength(2);
    expect(plan.categories).toHaveLength(2);
    expect(plan.products).toHaveLength(3);
    expect(plan.brands.map((b) => b.name).sort()).toEqual(['Logitech', 'Razer']);
    expect(plan.categories.map((c) => c.slug).sort()).toEqual(['ban-phim', 'chuot']);
  });
});
