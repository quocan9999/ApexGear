import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="label-md text-on-surface-variant">
            {label}
          </label>
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
            className,
          )}
          {...props}
        />
        {error && <p className="body-sm text-error">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
export default Input;
