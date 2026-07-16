import { computeStockStatus } from './products.service';

describe('computeStockStatus', () => {
  it('returns OUT_OF_STOCK when available is 0 or negative', () => {
    expect(computeStockStatus(0, 5)).toBe('OUT_OF_STOCK');
    expect(computeStockStatus(-1, 5)).toBe('OUT_OF_STOCK');
  });

  it('returns LOW_STOCK when available is within threshold', () => {
    expect(computeStockStatus(1, 5)).toBe('LOW_STOCK');
    expect(computeStockStatus(5, 5)).toBe('LOW_STOCK');
  });

  it('returns IN_STOCK when available is above threshold', () => {
    expect(computeStockStatus(6, 5)).toBe('IN_STOCK');
    expect(computeStockStatus(100, 5)).toBe('IN_STOCK');
  });
});
