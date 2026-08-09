import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, startAdornment, endAdornment, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="label-md text-on-surface-variant">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {startAdornment && (
            <div className="absolute left-3 text-outline flex items-center justify-center">
              {startAdornment}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'h-12 w-full rounded-lg border bg-surface-container-lowest px-4 body-md',
              'border-outline-variant placeholder:text-outline',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
              'transition-colors duration-200',
              error && 'border-error focus:border-error focus:ring-error/20',
              startAdornment && 'pl-10',
              endAdornment && 'pr-12',
              className,
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-2 text-outline flex items-center justify-center">
              {endAdornment}
            </div>
          )}
        </div>
        {error && <p className="body-sm text-error">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
export default Input;
