import type { ReactNode } from 'react';
import { useAuthInit } from './hooks/useAuth';
import AppRoutes from './routes';

function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
