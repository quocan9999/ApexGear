import { v2 as cloudinary } from 'cloudinary';
import { TransformedImage } from './types';

export interface UploaderDeps {
  skip: boolean;
  upload: (url: string, folder: string) => Promise<{ url: string; publicId: string }>;
}

function defaultDeps(): UploaderDeps {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return {
    skip: process.env.SKIP_UPLOAD === 'true',
    upload: async (url, folder) => {
      const res = await cloudinary.uploader.upload(url, { folder });
      return { url: res.secure_url, publicId: res.public_id };
    },
  };
}

/**
 * Upload each image to Cloudinary under `folder`, returning images with real
 * url + publicId. Images that fail (or all, when skip=true) are dropped — the
 * seeder only writes images that have a publicId.
 */
export async function uploadImages(
  images: TransformedImage[],
  folder: string,
  deps: UploaderDeps = defaultDeps(),
): Promise<TransformedImage[]> {
  if (deps.skip) return [];
  const out: TransformedImage[] = [];
  for (const img of images) {
    try {
      const { url, publicId } = await deps.upload(img.url, folder);
      out.push({ ...img, url, publicId });
    } catch (e) {
      console.warn(`  ⚠ upload failed for ${img.url}: ${(e as Error).message}`);
    }
  }
  return out;
}
