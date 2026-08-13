import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types/database';
import { hasAnyRole } from '@/lib/helpers';

interface ProtectedRouteProps {
  children: ReactNode;
  roles: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          <p className="text-sm text-stone-500">Cargando</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAnyRole(profile.roles, roles)) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <h2 className="text-lg font-medium text-stone-800">Sin acceso</h2>
          <p className="mt-2 text-sm text-stone-500">
            No tiene permisos para ver esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
