import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      id,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;
    const describedBy = error
      ? [ariaDescribedBy, errorId].filter(Boolean).join(' ')
      : ariaDescribedBy;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="label-md text-on-surface">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(
            'body-md min-h-24 w-full resize-y rounded border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface',
            'placeholder:text-outline transition-colors duration-200',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-70',
            error && 'border-error focus:border-error focus:ring-error/20',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export default Textarea;
