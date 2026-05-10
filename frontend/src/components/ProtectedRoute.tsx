import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: string;
}

export default function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredPermission && user) {
        // Super Admin and Admin bypass all checks and have full access
        const isBypass = user.username === 'admin' || user.roles?.some(r => r === 'Super Admin' || r === 'Admin') || user.role === 'Admin';
        if (!isBypass) {
            const hasPermission = user.permissions?.includes(requiredPermission);
            if (!hasPermission) {
                // If unauthorized, redirect securely to main dashboard
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <>{children}</>;
}
