import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ModuleGuardProps {
    /** Module ID that must be in user.tenantModules (e.g. "academic", "finance") */
    module: string;
    children: React.ReactNode;
    /** Where to redirect when access is denied – defaults to /dashboard */
    redirectTo?: string;
}

/**
 * ModuleGuard
 * -----------
 * Wraps a route and checks whether the signed-in tenant's plan includes
 * the required module. If not, the user is redirected to /dashboard.
 * SuperAdmins bypass this check entirely.
 *
 * Usage:
 *   <Route path="/academic" element={
 *     <ModuleGuard module="academic">
 *       <AcademicPage />
 *     </ModuleGuard>
 *   } />
 */
export default function ModuleGuard({ module, children, redirectTo = '/dashboard' }: ModuleGuardProps) {
    const { user } = useAuthStore();

    // SuperAdmin always has access
    if (user?.role === 'SUPER_ADMIN') return <>{children}</>;

    const tenantModules = user?.tenantModules;

    // If tenantModules is not yet defined (old session / loading), allow through
    if (!tenantModules || tenantModules.length === 0) return <>{children}</>;

    if (tenantModules.includes(module)) return <>{children}</>;

    return <Navigate to={redirectTo} replace />;
}
