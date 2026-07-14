import { slugify } from './slugify';

describe('slugify', () => {
  it('converts Vietnamese text to ascii slug', () => {
    expect(slugify('Tai nghe Over-ear')).toBe('tai-nghe-over-ear');
    expect(slugify('Bàn phím cơ')).toBe('ban-phim-co');
    expect(slugify('Đồ chơi')).toBe('do-choi');
  });

  it('lowercases and trims', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world');
  });

  it('collapses separators and strips punctuation', () => {
    expect(slugify('Sony / Razer!!!')).toBe('sony-razer');
    // underscores are stripped as non [a-z0-9\s-], then hyphens collapse
    expect(slugify('a__b--c')).toBe('ab-c');
    expect(slugify('a b  c')).toBe('a-b-c');
  });

  it('returns empty string for empty-like input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('!!!')).toBe('');
  });
});
