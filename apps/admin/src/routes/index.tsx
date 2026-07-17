import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../components/layout';
import LoginPage from '../pages/LoginPage';
import RoleRoute from './RoleRoute';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const ProductFormPage = lazy(() => import('../pages/products/ProductFormPage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const BrandsPage = lazy(() => import('../pages/BrandsPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/orders/OrderDetailPage'));
const InventoryPage = lazy(() => import('../pages/InventoryPage'));
const ReviewsPage = lazy(() => import('../pages/ReviewsPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));
const CouponsPage = lazy(() => import('../pages/CouponsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ShippingRulesPage = lazy(() => import('../pages/ShippingRulesPage'));

const CONTENT_ROLES = ['ADMIN', 'CONTENT_MANAGER'] as const;
const INVENTORY_ROLES = ['ADMIN', 'CONTENT_MANAGER', 'INVENTORY_MANAGER'] as const;
const ORDER_ROLES = ['ADMIN', 'ORDER_MANAGER'] as const;
const ADMIN_ONLY = ['ADMIN'] as const;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RoleRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          <Route element={<RoleRoute allow={CONTENT_ROLES} />}>
            <Route path="products" element={<ProductsPage />} />
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

          <Route element={<RoleRoute allow={ADMIN_ONLY} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="coupons" element={<CouponsPage />} />
            <Route path="shipping" element={<ShippingRulesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
