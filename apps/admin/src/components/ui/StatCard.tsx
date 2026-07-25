import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
  featured?: boolean;
  index?: number;
  to?: string;
}

const toneStyles: Record<Tone, { dot: string; value: string }> = {
  default: {
    dot: 'bg-on-surface-variant/60',
    value: 'text-on-surface',
  },
  primary: {
    dot: 'bg-primary',
    value: 'text-primary',
  },
  success: {
    dot: 'bg-success',
    value: 'text-success',
  },
  warning: {
    dot: 'bg-warning',
    value: 'text-warning',
  },
  error: {
    dot: 'bg-error',
    value: 'text-error',
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  featured = false,
  index,
  to,
}: StatCardProps) {
  const styles = toneStyles[tone];
  const className = cn(
    'group admin-reveal admin-hover-lift admin-hover-lift-active relative flex min-w-0 flex-col gap-sm overflow-hidden rounded-lg border border-outline-variant/70 bg-surface-container-low p-md transition-colors duration-[var(--dur-short)] hover:border-outline md:p-lg',
    featured && 'lg:min-h-[168px]',
    to && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  );
  const style = index === undefined ? undefined : { ['--i' as string]: index };

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', styles.dot)} />
          <p className="truncate text-[15px] font-medium uppercase tracking-[0.12em] text-on-surface-variant">{label}</p>
        </div>
        {icon ? (
          <span aria-hidden="true" className="shrink-0 text-on-surface-variant/50 transition-colors group-hover:text-on-surface-variant">
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'break-all font-semibold tracking-tight tabular-nums leading-tight',
          featured ? 'mt-1 text-xl sm:text-2xl xl:text-3xl' : 'mt-2 text-2xl',
          styles.value,
        )}
      >
        {value}
      </p>
      {hint ? <p className="label-sm text-on-surface-variant">{hint}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {body}
      </Link>
    );
  }

  return (
    <section className={className} style={style}>
      {body}
    </section>
  );
}

export function StatCardSkeleton({ index, featured = false }: { index?: number; featured?: boolean }) {
  const style = index === undefined ? undefined : { ['--i' as string]: index };

  return (
    <div
      className={cn(
        'admin-reveal relative flex min-w-0 flex-col gap-sm overflow-hidden rounded-lg border border-outline-variant/70 bg-surface-container-low p-md md:p-lg',
        featured && 'lg:min-h-[168px]',
      )}
      style={style}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-2.5 w-20 animate-pulse rounded-full bg-surface-container-high" />
        <div className="h-3.5 w-3.5 animate-pulse rounded bg-surface-container-high" />
      </div>
      <div
        className={cn(
          'mt-2 h-7 animate-pulse rounded bg-surface-container-high',
          featured ? 'w-36' : 'w-24',
        )}
      />
      <div className="h-2.5 w-16 animate-pulse rounded-full bg-surface-container-high" />
    </div>
  );
}

export function StatIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
