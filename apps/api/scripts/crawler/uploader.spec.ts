import { uploadImages, UploaderDeps } from './uploader';
import { TransformedImage } from './types';

const imgs: TransformedImage[] = [
  { url: 'https://cdn/a.jpg', publicId: '', alt: 'x', isPrimary: true, sortOrder: 0 },
  { url: 'https://cdn/b.jpg', publicId: '', alt: 'x', isPrimary: false, sortOrder: 1 },
];

describe('uploadImages', () => {
  it('uploads each image and fills url + publicId', async () => {
    const deps: UploaderDeps = {
      skip: false,
      upload: async (url, folder) => ({ url: `https://res.cloudinary.com/${folder}/x`, publicId: `${folder}/${url.slice(-5)}` }),
    };
    const out = await uploadImages(imgs, 'apexgear/products/chuot/logitech', deps);
    expect(out).toHaveLength(2);
    expect(out[0].url).toContain('res.cloudinary.com');
    expect(out[0].publicId).toContain('apexgear/products/chuot/logitech');
    expect(out[0].isPrimary).toBe(true); // metadata preserved
  });

  it('when skip=true, drops images (no publicId) so seeder skips them', async () => {
    const deps: UploaderDeps = { skip: true, upload: async () => { throw new Error('should not call'); } };
    expect(await uploadImages(imgs, 'f', deps)).toEqual([]);
  });

  it('drops an image whose upload fails but keeps the rest', async () => {
    let n = 0;
    const deps: UploaderDeps = {
      skip: false,
      upload: async (url, folder) => { if (n++ === 0) throw new Error('net'); return { url: 'https://res/y', publicId: `${folder}/y` }; },
    };
    const out = await uploadImages(imgs, 'f', deps);
    expect(out).toHaveLength(1);
    expect(out[0].publicId).toBe('f/y');
  });
});
