import type { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
    children: JSX.Element;
    roles?: string[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
    const { isAuthenticated, usuario } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si se especifican roles, verificar que el usuario tenga uno de ellos
    if (roles && roles.length > 0) {
        const userRole = usuario?.rol || '';
        if (!roles.some(rol => rol.toLowerCase() === userRole.toLowerCase())) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};