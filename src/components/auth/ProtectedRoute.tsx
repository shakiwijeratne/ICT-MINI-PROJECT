import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import type { UserRole } from '../../types';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
