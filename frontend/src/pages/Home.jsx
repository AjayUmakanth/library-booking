import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user, userLoading } = useAuth();

  if (userLoading) {
    return (
      <div className="container py-5 text-center text-muted">Loading…</div>
    );
  }
  if (user) return <Navigate to="/book" replace />;
  return <Navigate to="/login" replace />;
}
