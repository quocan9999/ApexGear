import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import Spinner from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingLabel,
      children,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const variants = {
      primary: 'bg-primary text-on-primary hover:bg-primary-container',
      secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high',
      outline: 'border border-outline-variant text-on-surface hover:bg-surface-container-low',
      ghost: 'text-on-surface hover:bg-surface-container-low',
      danger: 'bg-error text-on-error hover:bg-on-error-container',
    };
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };
    const accessibleName = ariaLabel ?? (typeof children === 'string' ? children : undefined);

    return (
      <button
        ref={ref}
        aria-busy={isLoading || undefined}
        aria-label={accessibleName}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Spinner className="text-current [&>span]:h-4 [&>span]:w-4" label={loadingLabel} />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
