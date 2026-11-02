import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './ui/Bits.jsx';

/**
 * Client-side gate for UX only — every protected API endpoint enforces the
 * same rules on the server.
 */
export default function ProtectedRoute({ role = 'USER', children }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!hasRole(role)) {
    return (
      <div className="container-site py-24 text-center">
        <p className="kicker text-blood-400">403</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-white">This area is for the editorial team.</h1>
        <p className="mt-3 text-ink-300">Your account doesn’t have permission to view this page.</p>
      </div>
    );
  }
  return children || <Outlet />;
}
