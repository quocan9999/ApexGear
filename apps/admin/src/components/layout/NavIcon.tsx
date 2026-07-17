import type { ReactNode, SVGProps } from 'react';
import type { NavIcon as NavIconName } from './nav-config';

interface NavIconProps extends SVGProps<SVGSVGElement> {
  name: NavIconName;
}

const paths: Record<NavIconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  box: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
      <path d="M12 11v10" />
    </>
  ),
  category: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="17.5" cy="17.5" r="3.5" />
    </>
  ),
  brand: (
    <>
      <path d="M12 3 9.5 5.5 6 5l-.5 3.5L3 11l2.5 2.5L6 17l3.5-.5L12 19l2.5-2.5L18 17l.5-3.5L21 11l-2.5-2.5L18 5l-3.5.5L12 3Z" />
      <path d="m9.5 11 1.7 1.7 3.5-3.5" />
    </>
  ),
  orders: (
    <>
      <path d="M3 5h2l2 11h10l2-8H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
    </>
  ),
  inventory: (
    <>
      <path d="M3 9h18v12H3z" />
      <path d="m5 3-2 6h18l-2-6H5Z" />
      <path d="M9 13h6" />
    </>
  ),
  reviews: (
    <>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a4 4 0 0 1 0 7.5M17 15a6 6 0 0 1 4.5 6" />
    </>
  ),
  coupon: (
    <>
      <path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4V3H3v5Z" />
      <path d="M12 6v2M12 12v2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shipping: (
    <>
      <path d="M5 18H3c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2h-2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M8 18h6" />
      <circle cx="16" cy="18" r="2" />
      <path d="M17 8h4c1.1 0 2 .9 2 2v6h-3" />
      <path d="M17 11h6" />
    </>
  ),
};

export default function NavIcon({ name, className, ...props }: NavIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
