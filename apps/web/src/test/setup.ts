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

afterEach(() => {
  cleanup();
  localStorage.clear();
});
