import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { getCloudinaryUrl } from '../../utils/cloudinary';
import type { ProductImage } from '../../types';

interface ImageGalleryProps {
  images: ProductImage[];
  altText: string;
  className?: string;
}

export default function ImageGallery({ images, altText, className }: ImageGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.displayOrder - b.displayOrder;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = sorted.length > 0 ? Math.min(activeIndex, sorted.length - 1) : 0;
  const active = sorted[safeIndex];

  useEffect(() => {
    setActiveIndex(0);
  }, [sorted.length]);

  if (!active) {
    return (
      <div
        className={cn(
          'flex aspect-square w-full items-center justify-center rounded-xl bg-surface-container-low text-outline',
          className,
        )}
        aria-hidden
      >
        <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-md', className)}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-container-low">
        <img
          key={active.id}
          src={getCloudinaryUrl(active.url, 'large')}
          alt={active.alt || altText}
          className="h-full w-full object-contain p-md transition-opacity duration-300"
          loading="eager"
        />
      </div>

      {sorted.length > 1 && (
        <ul
          className="flex gap-sm overflow-x-auto pb-xs"
          role="tablist"
          aria-label="Product images"
        >
          {sorted.map((img, i) => {
            const isActive = i === safeIndex;
            return (
              <li key={img.id} className="flex-shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    'relative h-16 w-16 overflow-hidden rounded-md border-2 bg-surface-container-low p-xs',
                    'transition-all',
                    isActive
                      ? 'border-primary'
                      : 'border-transparent hover:border-outline-variant',
                  )}
                >
                  <img
                    src={getCloudinaryUrl(img.url, 'thumbnail')}
                    alt=""
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
