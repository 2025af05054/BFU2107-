import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
}

export const RoleBasedRoute = ({ children, allowedRoles, fallback }: RoleBasedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback || (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access this page. Required roles: {allowedRoles.join(', ')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};