import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

export const STAFF_ROLES: readonly Role[] = [
  'ADMIN',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
];

export function isStaffRole(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

interface RoleRouteProps {
  allow?: readonly Role[];
}

export default function RoleRoute({ allow }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner fullscreen />;

  if (!isAuthenticated || !user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (!isStaffRole(user.role)) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = allow ?? STAFF_ROLES;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
