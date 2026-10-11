import { Spin } from 'antd';
import { Navigate, Outlet } from 'react-router';
import type { ReactNode } from 'react';
import { useMe } from '../features/auth/index.ts';

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

/** Blocks unauthenticated access — session truth comes from the `me` query. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { user, isLoading } = useMe();
  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return children ?? <Outlet />;
}

/** Admin-only gate (reports, user management). Staff is sent back to dashboard. */
export function RequireAdmin() {
  const { user, isLoading, isAdmin } = useMe();
  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
