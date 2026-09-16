import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PublicOnlyRoute - Prevents authenticated users from accessing
 * public auth pages (/login, /register, /admin/login).
 * If authenticated, redirects to the role's appropriate home:
 * - Candidate -> /profile
 * - Employer -> /employer
 * - Admin -> /admin
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'Employer') {
      return <Navigate to="/employer" replace />;
    }
    // Candidates redirect to /profile
    return <Navigate to="/profile" replace />;
  }

  return children;
};

export default PublicOnlyRoute;

