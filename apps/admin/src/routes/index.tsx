import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../components/layout';
import LoginPage from '../pages/LoginPage';
import AcceptInvitationPage from '../pages/AcceptInvitationPage';
import RoleRoute from './RoleRoute';
import { CUSTOMER_MANAGER_ROLES, STAFF_ROLES } from '@apexgear/shared';
import type { Role } from '../types';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const ProductFormPage = lazy(() => import('../pages/products/ProductFormPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const BrandsPage = lazy(() => import('../pages/BrandsPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/orders/OrderDetailPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const ReviewsPage = lazy(() => import('../pages/ReviewsPage'));
const CustomersPage = lazy(() => import('../pages/CustomersPage'));
const StaffPage = lazy(() => import('../pages/StaffPage'));
const CouponsPage = lazy(() => import('../pages/CouponsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ShippingRulesPage = lazy(() => import('../pages/ShippingRulesPage'));

const PRODUCT_READ_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
];
const CONTENT_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'];
const INVENTORY_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
];
const ORDER_ROLES: readonly Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
];
const COUPON_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'];
const SHIPPING_ROLES: readonly Role[] = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER'];
const CUSTOMER_MANAGER: readonly Role[] = CUSTOMER_MANAGER_ROLES;
const STAFF_MANAGER: readonly Role[] = STAFF_ROLES.filter((role) => role === 'SUPER_ADMIN' || role === 'ADMIN');
const ADMIN_ONLY: readonly Role[] = ['SUPER_ADMIN', 'ADMIN'];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/staff/activate" element={<AcceptInvitationPage />} />

      <Route element={<RoleRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<RoleRoute allow={PRODUCT_READ_ROLES} />}>
            <Route path="products" element={<ProductsPage />} />
          </Route>

          <Route element={<RoleRoute allow={CONTENT_ROLES} />}>
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:slug/edit" element={<ProductFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
          </Route>

          <Route element={<RoleRoute allow={INVENTORY_ROLES} />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<RoleRoute allow={ORDER_ROLES} />}>
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
          </Route>

          <Route element={<RoleRoute allow={CUSTOMER_MANAGER} />}>
            <Route path="customers" element={<CustomersPage />} />
            <Route element={<RoleRoute allow={STAFF_MANAGER} />}>
              <Route path="staff" element={<StaffPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allow={COUPON_ROLES} />}>
            <Route path="coupons" element={<CouponsPage />} />
          </Route>

          <Route element={<RoleRoute allow={SHIPPING_ROLES} />}>
            <Route path="shipping" element={<ShippingRulesPage />} />
          </Route>

          <Route element={<RoleRoute allow={ADMIN_ONLY} />}>
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
