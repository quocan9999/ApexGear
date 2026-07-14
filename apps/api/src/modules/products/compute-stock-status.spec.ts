import { computeStockStatus } from './products.service';

describe('computeStockStatus', () => {
  it('returns out_of_stock when available is 0 or negative', () => {
    expect(computeStockStatus(0, 5)).toBe('out_of_stock');
    expect(computeStockStatus(-1, 5)).toBe('out_of_stock');
  });

  it('returns low_stock when available is within threshold', () => {
    expect(computeStockStatus(1, 5)).toBe('low_stock');
    expect(computeStockStatus(5, 5)).toBe('low_stock');
  });

  it('returns in_stock when available is above threshold', () => {
    expect(computeStockStatus(6, 5)).toBe('in_stock');
    expect(computeStockStatus(100, 5)).toBe('in_stock');
  });
});
