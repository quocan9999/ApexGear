import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEffect } from 'react';
import { render } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

/**
 * Renders a tiny driver that, once mounted, pushes a new route via
 * react-router's `useNavigate`. This drives a real pathname change through
 * React Router's history, which is what `useLocation` reacts to in tests.
 */
function NavDriver({ to }: { to: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  return null;
}

/**
 * Exposes the current pathname to the test so we can assert the driver
 * actually moved us before checking scroll behavior.
 */
function PathSpy({ onChange }: { onChange: (pathname: string) => void }) {
  const { pathname } = useLocation();
  useEffect(() => {
    onChange(pathname);
  }, [pathname, onChange]);
  return null;
}

function PageA() {
  return <h1>Page A</h1>;
}

function PageB() {
  return <h1>Page B</h1>;
}

beforeEach(() => {
  // jsdom exposes scrollY/screen as 0; reset defensively in case a previous
  // test (or the previous test's tear-down) mutated them.
  window.scrollTo(0, 0);
});

describe('ScrollToTop', () => {
  it('scrolls to the top when the route pathname changes', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo');

    render(
      <MemoryRouter initialEntries={['/page-a']}>
        <ScrollToTop />
        <NavDriver to="/page-b" />
        <Routes>
          <Route path="/page-a" element={<PageA />} />
          <Route path="/page-b" element={<PageB />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('does not scroll on the initial render', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo');

    render(
      <MemoryRouter initialEntries={['/page-a']}>
        <ScrollToTop />
        <Routes>
          <Route path="/page-a" element={<PageA />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('uses the latest pathname after back/forward navigation', () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo');
    let lastPath = '';

    render(
      <MemoryRouter initialEntries={['/page-a', '/page-b']} initialIndex={0}>
        <ScrollToTop />
        <PathSpy onChange={(p) => (lastPath = p)} />
        <NavDriver to="/page-b" />
        <Routes>
          <Route path="/page-a" element={<PageA />} />
          <Route path="/page-b" element={<PageB />} />
        </Routes>
      </MemoryRouter>,
    );

    // After mount + driver navigation, we should be on /page-b and have
    // scrolled to top exactly once for that change.
    expect(lastPath).toBe('/page-b');
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });
});
