import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Testing Library's `waitFor` detects fake timers by probing a `jest` global.
// Vitest doesn't define one, so under `vi.useFakeTimers()` RTL falls back to the
// real-timer branch and deadlocks against the frozen clock. Exposing a minimal
// `jest` shim that forwards to vitest lets RTL drive the fake clock. `waitFor`
// only takes this branch while fake timers are active (it checks setTimeout.clock),
// so real-timer tests are unaffected.
(globalThis as typeof globalThis & { jest?: unknown }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
};

// recharts ResponsiveContainer needs ResizeObserver + non-zero layout boxes.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as typeof globalThis & { ResizeObserver?: unknown }).ResizeObserver =
  ResizeObserverStub;

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  const rect = originalGetBoundingClientRect.call(this);
  if (rect.width > 0 && rect.height > 0) return rect;
  return {
    ...rect,
    width: rect.width || 600,
    height: rect.height || 300,
    right: rect.right || rect.left + (rect.width || 600),
    bottom: rect.bottom || rect.top + (rect.height || 300),
  };
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});
