import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface CheckoutStepperProps {
  current: 1 | 2 | 3;
}

export default function CheckoutStepper({ current }: CheckoutStepperProps) {
  const { t } = useTranslation();

  const steps = [
    { index: 1 as const, label: t('checkout.steps.address') },
    { index: 2 as const, label: t('checkout.steps.payment') },
    { index: 3 as const, label: t('checkout.steps.review') },
  ];

  return (
    <ol className="flex items-center gap-sm" aria-label={t('checkout.title')}>
      {steps.map((step, i) => {
        const active = step.index === current;
        const done = step.index < current;
        return (
          <li key={step.index} className="flex flex-1 items-center gap-sm">
            <span
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full label-md transition-colors',
                active || done
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant',
              )}
            >
              {step.index}
            </span>
            <span
              className={cn(
                'body-sm',
                active ? 'font-semibold text-on-surface' : 'text-on-surface-variant',
              )}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'mx-xs hidden h-px flex-1 sm:block',
                  done ? 'bg-primary' : 'bg-outline-variant',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
