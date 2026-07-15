import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      id,
      children,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;
    const describedBy = error
      ? [ariaDescribedBy, errorId].filter(Boolean).join(' ')
      : ariaDescribedBy;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="label-md text-on-surface">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(
            'body-md h-12 w-full rounded border border-outline-variant bg-surface-container-lowest px-4 text-on-surface',
            'transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-70',
            error && 'border-error focus:border-error focus:ring-error/20',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
