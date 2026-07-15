import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router-dom';
import { useAuthInit } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';

function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}

function AppRoutes() {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<div>{t('admin.title')}</div>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
