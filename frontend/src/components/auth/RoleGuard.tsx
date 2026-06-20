import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: 'ADMIN' | 'USER';
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  fallback = <div className="p-4 text-center text-gray-600 dark:text-gray-400">Access denied. Insufficient permissions.</div>,
  showFallback = false
}) => {
  const { hasRole } = useAuth();

  // normalize the role string to match the hasRole parameter type ("Admin" | "User")
  const normalizedRole: 'Admin' | 'User' = requiredRole === 'ADMIN' ? 'Admin' : 'User';

  if (!hasRole(normalizedRole)) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};