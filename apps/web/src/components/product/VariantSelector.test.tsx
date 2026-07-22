import { describe, expect, it } from 'vitest';
import { publicStockStatus } from './VariantSelector';
import type { ProductVariant } from '../../types';

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 'v1',
    name: 'Default',
    sku: 'SKU-1',
    price: null,
    stockStatus: 'IN_STOCK',
    isDefault: true,
    attributes: null,
    displayOrder: 0,
    ...overrides,
  };
}

describe('publicStockStatus', () => {
  it('treats a zero-available variant as out of stock even when stockStatus is stale or missing', () => {
    const variant = makeVariant({
      stockAvailable: 0,
      stockStatus: undefined,
    } as Partial<ProductVariant>);

    expect(publicStockStatus(variant)).toBe('out_of_stock');
  });

  it('uses the explicit stockStatus when exact stock is not present', () => {
    expect(publicStockStatus(makeVariant({ stockStatus: 'LOW_STOCK' }))).toBe('low_stock');
  });
});
