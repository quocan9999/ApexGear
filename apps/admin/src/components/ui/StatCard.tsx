import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'error';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: Tone;
}

const toneStyles: Record<Tone, { bar: string; icon: string; value: string }> = {
  default: {
    bar: 'bg-outline',
    icon: 'bg-surface-container text-on-surface-variant',
    value: 'text-on-surface',
  },
  primary: {
    bar: 'bg-primary',
    icon: 'bg-primary/10 text-primary',
    value: 'text-primary',
  },
  success: {
    bar: 'bg-green-500',
    icon: 'bg-green-100 text-green-700',
    value: 'text-green-700',
  },
  warning: {
    bar: 'bg-warning',
    icon: 'bg-warning/15 text-warning',
    value: 'text-warning',
  },
  error: {
    bar: 'bg-error',
    icon: 'bg-error-container text-on-error-container',
    value: 'text-error',
  },
};

export function StatCard({ label, value, hint, icon, tone = 'default' }: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-md shadow-level-1 transition-[border-color,transform,box-shadow] duration-[var(--dur-short)] hover:-translate-y-0.5 hover:border-outline hover:shadow-level-2">
      <span aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-1', styles.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-sm text-on-surface-variant">{label}</p>
          <p className={cn('mt-2 truncate text-2xl font-semibold tracking-tight', styles.value)}>
            {value}
          </p>
          {hint ? <p className="mt-1 label-sm text-on-surface-variant">{hint}</p> : null}
        </div>
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-[var(--dur-short)] group-hover:scale-105',
            styles.icon,
          )}
        >
          {icon}
        </span>
      </div>
    </section>
  );
}

export function StatIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
