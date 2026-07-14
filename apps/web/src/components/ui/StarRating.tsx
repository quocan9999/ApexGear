import { cn } from '../../utils/cn';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
  /** When provided, stars become interactive buttons and this fires with the 1-based value. */
  onRate?: (value: number) => void;
  /** Accessible label for each interactive star, e.g. (n) => `${n} sao`. */
  getStarLabel?: (value: number) => string;
}

export default function StarRating({
  rating,
  max = 5,
  size = 'sm',
  onRate,
  getStarLabel,
}: StarRatingProps) {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const interactive = typeof onRate === 'function';

  if (interactive) {
    return (
      <div className="flex items-center gap-0.5" role="group">
        {Array.from({ length: max }, (_, i) => {
          const value = i + 1;
          return (
            <button
              key={i}
              type="button"
              aria-pressed={value <= rating}
              aria-label={getStarLabel?.(value) ?? String(value)}
              onClick={() => onRate?.(value)}
              className={cn(
                'transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm',
                value <= rating ? 'text-amber-400' : 'text-outline-variant',
              )}
            >
              <svg className={cn(starSize, 'w-6 h-6')} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={cn(starSize, i < Math.round(rating) ? 'text-amber-400' : 'text-outline-variant')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
