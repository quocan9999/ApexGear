import { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  /** ISO timestamp at which the countdown reaches zero. */
  expiresAt: string;
  /** Called exactly once when the remaining time hits zero. */
  onExpire(): void;
}

function remainingSeconds(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 1000));
}

function formatMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Ticks every second, deriving remaining time from `expiresAt - Date.now()`
 * so it stays accurate across re-renders and tab throttling. Fires `onExpire`
 * once when it reaches zero, then clears its interval.
 */
export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));
  const expiredRef = useRef(false);
  // Keep the latest onExpire without re-arming the interval.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredRef.current = false;
    setSeconds(remainingSeconds(expiresAt));

    let id: ReturnType<typeof setInterval>;
    const tick = () => {
      const next = remainingSeconds(expiresAt);
      setSeconds(next);
      if (next <= 0) {
        clearInterval(id);
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current();
        }
      }
    };

    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="title-md tabular-nums text-on-surface" role="timer" aria-live="polite">
      {formatMmSs(seconds)}
    </span>
  );
}
