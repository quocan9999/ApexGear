type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

const TRANSFORMS: Record<ImageSize, string> = {
  thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
  medium: 'w_500,h_500,c_limit,q_auto,f_auto',
  large: 'w_1000,h_1000,c_limit,q_auto,f_auto',
  original: 'q_auto,f_auto',
};

export function getCloudinaryUrl(url: string, size: ImageSize = 'medium'): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  // Insert transformation before /upload/
  return url.replace('/upload/', `/upload/${TRANSFORMS[size]}/`);
}
