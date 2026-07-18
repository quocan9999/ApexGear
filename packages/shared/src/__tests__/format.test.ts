import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatPrice } from '../format';

describe('formatPrice', () => {
  it('formats VND currency with grouping and no decimals', () => {
    const result = formatPrice(1000000);

    expect(result).toContain('1.000.000');
    expect(result).toContain('₫');
    expect(result).not.toContain(',00');
  });

  it('coerces Prisma Decimal strings and rejects missing or invalid input', () => {
    expect(formatPrice('1990000.00')).toContain('1.990.000');
    expect(formatPrice(0)).toContain('0');
    expect(formatPrice(null)).toBe('—');
    expect(formatPrice(undefined)).toBe('—');
    expect(formatPrice('abc')).toBe('—');
  });

  it('rounds fractional digits for VND', () => {
    expect(formatPrice(1500.75)).toContain('1.501');
  });
});

describe('formatDate', () => {
  it('formats as dd/mm/yyyy', () => {
    expect(formatDate('2026-12-25T12:00:00.000Z')).toBe('25/12/2026');
  });
});

describe('formatDateTime', () => {
  it('formats date and time parts for admin tables', () => {
    const result = formatDateTime('2026-12-25T12:30:00.000Z');

    expect(result).toContain('25/12/2026');
    expect(result).toMatch(/12:30|19:30/);
  });
});
