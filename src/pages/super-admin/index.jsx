import { Outlet, Navigate, useLocation } from 'react-router-dom';

export default function SuperAdminIndex() {
  const location = useLocation();
  if (location.pathname === '/super-admin') return <Navigate to="users" replace />;
  return <Outlet />;
}
