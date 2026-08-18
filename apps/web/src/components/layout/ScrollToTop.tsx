import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router does not reset scroll position when navigating between routes.
 * Without this, clicking a footer link from the bottom of a long page lands
 * the user back at the bottom of the new page. We mirror the browser's
 * default behaviour — the scroll resets to the top on every pathname change,
 * but we deliberately skip the very first render so an in-flight session
 * restore doesn't yank the viewport when the page first loads.
 *
 * Mount this once near the top of the route tree (inside the Router, but
 * outside any layout that might unmount on navigation).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
