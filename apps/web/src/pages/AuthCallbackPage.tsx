import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth().then(() => navigate('/', { replace: true }));
  }, [checkAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
