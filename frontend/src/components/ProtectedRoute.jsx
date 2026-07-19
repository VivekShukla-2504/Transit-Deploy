import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center">
        <div>
          <p className="font-display text-lg text-base-100">Access restricted</p>
          <p className="mt-2 text-sm text-base-400">
            Your role ({user.role}) doesn't have access to this section.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
