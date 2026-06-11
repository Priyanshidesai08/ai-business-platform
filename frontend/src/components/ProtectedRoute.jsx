import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-panel px-4 text-ink">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
      </main>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
