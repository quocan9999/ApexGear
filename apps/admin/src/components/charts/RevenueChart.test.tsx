// recharts' ResponsiveContainer uses ResizeObserver + getBoundingClientRect
// which jsdom does not provide. Stub both before importing the component.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = ResizeObserverStub;

const originalGetBoundingClientRect =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLElement.prototype as any).getBoundingClientRect;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLElement.prototype as any).getBoundingClientRect = function () {
  const rect = originalGetBoundingClientRect
    ? originalGetBoundingClientRect.call(this)
    : { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) };
  return {
    ...rect,
    width: rect.width || 600,
    height: rect.height || 300,
  };
};

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RevenueChart } from './RevenueChart';

describe('RevenueChart', () => {
  it('renders an svg for non-empty data', () => {
    const data = [
      { date: '2026-07-10', revenue: 1000000 },
      { date: '2026-07-11', revenue: 1500000 },
    ];
    const { container } = render(
      <div style={{ width: 600, height: 300 }}>
        <RevenueChart data={data} />
      </div>,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an empty state for empty data', () => {
    const { container } = render(
      <div style={{ width: 600, height: 300 }}>
        <RevenueChart data={[]} />
      </div>,
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
