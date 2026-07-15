import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      id,
      startAdornment,
      endAdornment,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const describedBy = error
      ? [ariaDescribedBy, errorId].filter(Boolean).join(' ')
      : ariaDescribedBy;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="label-md text-on-surface">
            {label}
          </label>
        )}
        <div className="relative">
          {startAdornment && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-outline">
              {startAdornment}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={describedBy}
            aria-invalid={error ? true : ariaInvalid}
            className={cn(
              'body-md h-12 w-full rounded border border-outline-variant bg-surface-container-lowest px-4 text-on-surface',
              'placeholder:text-outline transition-colors duration-200',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-70',
              startAdornment && 'pl-11',
              endAdornment && 'pr-12',
              error && 'border-error focus:border-error focus:ring-error/20',
              className,
            )}
            {...props}
          />
          {endAdornment && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">{endAdornment}</span>
          )}
        </div>
        {error && (
          <p id={errorId} className="body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
