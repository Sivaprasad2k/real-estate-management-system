import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null, requireUnauthenticated = false, fallbackPath = "/dashboard" }) => {
    const { isAuthenticated, hasRole } = useAuth();
    const location = useLocation();

    // If route requires user to NOT be logged in (like Home), bounce them away
    if (requireUnauthenticated && isAuthenticated()) {
        // Check roles to bounce to correct dashboard if they have a special one
        const storedRoles = sessionStorage.getItem('roles');
        let targetPath = fallbackPath;

        if (storedRoles) {
            try {
                const roles = JSON.parse(storedRoles);
                if (roles.includes("ROLE_ADMIN")) targetPath = "/admin-dashboard";
                else if (roles.includes("ROLE_MAINTENANCE")) targetPath = "/maintenance-dashboard";
            } catch (e) { }
        }
        return <Navigate to={targetPath} replace />;
    }

    // Standard auth guard
    if (!requireUnauthenticated && !isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role guard
    if (requiredRole && !hasRole(requiredRole)) {
        return <Navigate to="/" replace />;
    }

    // Specific bounce to prevent Admin/Maintenance from getting stuck on User routes
    if (location.pathname === '/dashboard' || location.pathname === '/add-property' || location.pathname === '/my-activity') {
        if (hasRole('ROLE_ADMIN')) {
            return <Navigate to="/admin-dashboard" replace />;
        }
        if (hasRole('ROLE_MAINTENANCE')) {
            return <Navigate to="/maintenance-dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
