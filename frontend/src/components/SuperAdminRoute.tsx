import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function SuperAdminRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // If not logged in as SUPER_ADMIN, strictly deny access and redirect to superadmin login
  if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
}

export default SuperAdminRoute;
