import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppRoutes from './routes';

function AuthProvider({ children }: { children: ReactNode }) {
  useAuth();
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
