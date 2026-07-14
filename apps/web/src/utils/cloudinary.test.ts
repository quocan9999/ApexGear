import { describe, expect, it } from 'vitest';
import { getCloudinaryUrl } from './cloudinary';

describe('getCloudinaryUrl', () => {
  const base = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

  it('returns the url unchanged when it is empty', () => {
    expect(getCloudinaryUrl('')).toBe('');
  });

  it('returns the url unchanged when it is not a cloudinary url', () => {
    const url = 'https://example.com/image/upload/photo.jpg';
    expect(getCloudinaryUrl(url)).toBe(url);
  });

  it('injects the medium transform by default', () => {
    expect(getCloudinaryUrl(base)).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_500,h_500,c_limit,q_auto,f_auto/sample.jpg',
    );
  });

  it('injects the thumbnail transform', () => {
    expect(getCloudinaryUrl(base, 'thumbnail')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_150,h_150,c_fill,q_auto,f_auto/sample.jpg',
    );
  });

  it('injects the large transform', () => {
    expect(getCloudinaryUrl(base, 'large')).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_1000,h_1000,c_limit,q_auto,f_auto/sample.jpg',
    );
  });

  it('injects the original transform', () => {
    expect(getCloudinaryUrl(base, 'original')).toBe(
      'https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/sample.jpg',
    );
  });
});
