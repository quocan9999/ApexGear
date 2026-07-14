import { describe, expect, it } from 'vitest';
import { formatPrice, formatDate } from './format';

describe('formatPrice', () => {
  it('formats a value as VND currency with grouping and no decimals', () => {
    const result = formatPrice(1000000);
    // Locale spacing/symbol placement can vary by ICU build, so assert on the
    // stable parts: grouped digits, the đồng symbol, and no fractional part.
    expect(result).toContain('1.000.000');
    expect(result).toContain('₫');
    expect(result).not.toContain(',00');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toContain('0');
  });

  it('drops fractional digits', () => {
    expect(formatPrice(1500.75)).toContain('1.501');
  });
});

describe('formatDate', () => {
  it('formats as dd/mm/yyyy', () => {
    expect(formatDate('2026-07-14T12:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('renders the expected day, month and year parts', () => {
    // Use a midday UTC timestamp so timezone offsets cannot shift the date.
    expect(formatDate('2026-12-25T12:00:00.000Z')).toBe('25/12/2026');
  });
});
