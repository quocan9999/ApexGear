export function formatPrice(price: number | string | null | undefined): string {
  // Prisma Decimal fields arrive as strings over JSON (e.g. "1990000.00"),
  // and some rows may be null. Coerce and guard so the UI never renders "NaN đ".
  // Guard empty-ish input first: Number(null) and Number('') both coerce to 0,
  // which would otherwise print a misleading "0 ₫" for missing prices.
  if (price == null || price === '') return '—';
  const value = typeof price === 'number' ? price : Number(price);
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
