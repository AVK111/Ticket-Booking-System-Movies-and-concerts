import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap any route element: <ProtectedRoute roles={['organiser']}><Page /></ProtectedRoute>
// roles is optional — omit it to just require "logged in, any role".
const ProtectedRoute = ({ children, roles }) => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

    return children;
};

export default ProtectedRoute;