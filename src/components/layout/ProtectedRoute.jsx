import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/utils/constants';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  // Wait for the stored session to be read before deciding — otherwise a
  // refresh on a deep link bounces to sign-in for a frame.
  if (status === 'loading') return null;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
