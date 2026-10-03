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
        // Super Admin, Institute Admin, and Admin bypass all checks and have full access
        const isBypass =
            user.role === 'SUPER_ADMIN' ||
            user.role === 'INSTITUTE_ADMIN' ||
            user.role === 'Admin' ||
            user.role === 'Super Admin' ||
            user.username === 'superadmin' ||
            user.username === 'admin' ||
            user.username?.startsWith('admin_') ||
            user.roles?.some(r => ['SUPER_ADMIN', 'Super Admin', 'Admin', 'INSTITUTE_ADMIN'].includes(r)) ||
            Boolean((user as any).impersonated);
        if (!isBypass) {
            // Support multi-permission check separated by '|' (OR logic)
            const requiredList = requiredPermission.split('|');
            const hasPermission = requiredList.some(reqPerm => user.permissions?.includes(reqPerm));
            if (!hasPermission) {
                // If unauthorized, redirect securely to main dashboard
                return <Navigate to="/dashboard" replace />;
            }
        }
    }

    return <>{children}</>;
}
