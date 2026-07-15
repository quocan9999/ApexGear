export type StockStatus = 'in' | 'low' | 'out';

// The inventory list API does not return a stockStatus field; derive it on the FE.
// available === 0 -> 'out'; available <= threshold -> 'low'; otherwise 'in'.
export function getStockStatus(available: number, threshold: number): StockStatus {
  if (available === 0) return 'out';
  if (available <= threshold) return 'low';
  return 'in';
}
