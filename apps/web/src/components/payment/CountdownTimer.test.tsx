import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('CountdownTimer', () => {
  it('counts down and fires onExpire at zero', () => {
    const onExpire = vi.fn();
    const expiresAt = new Date(Date.now() + 3000).toISOString();
    render(<CountdownTimer expiresAt={expiresAt} onExpire={onExpire} />);
    expect(screen.getByText(/00:0[23]/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
