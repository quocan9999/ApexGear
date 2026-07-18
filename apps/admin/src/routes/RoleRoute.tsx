import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { STAFF_ROLES, isStaffRole } from '@apexgear/shared';
import type { Role } from '../types';

export { STAFF_ROLES, isStaffRole };

interface RoleRouteProps {
  allow?: readonly Role[];
}

export default function RoleRoute({ allow }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();
  const logoutStartedRef = useRef(false);
  const [customerLogoutComplete, setCustomerLogoutComplete] = useState(false);
  const customerDenied = Boolean(isAuthenticated && user && !isStaffRole(user.role));

  useEffect(() => {
    if (!customerDenied || logoutStartedRef.current) return;

    logoutStartedRef.current = true;
    void logout().then(
      () => setCustomerLogoutComplete(true),
      () => setCustomerLogoutComplete(true),
    );
  }, [customerDenied, logout]);

  if (isLoading) return <Spinner fullscreen />;

  if (customerDenied || logoutStartedRef.current) {
    if (!customerLogoutComplete) return <Spinner fullscreen />;
    return <Navigate to="/login" replace state={{ unauthorized: true }} />;
  }

  if (!isAuthenticated || !user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  const allowedRoles = allow ?? STAFF_ROLES;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
