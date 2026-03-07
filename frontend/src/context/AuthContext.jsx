import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const storedRoles = sessionStorage.getItem('roles');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const roles = storedRoles ? JSON.parse(storedRoles) : [];
                setUser({ token, roles, ...decoded });
            } catch (err) {
                console.error("Invalid token on startup", err);
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('roles');
            }
        }
        setLoading(false);
    }, []);

    const login = (token, roles) => {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('roles', JSON.stringify(roles || []));
        const decoded = jwtDecode(token);
        setUser({ token, roles: roles || [], ...decoded });
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('roles');
        setUser(null);
    };

    const hasRole = (role) => {
        if (user?.roles?.includes(role)) return true;
        // Fallback check memory during async state flushing
        const storedRoles = sessionStorage.getItem('roles');
        if (storedRoles) {
            try { return JSON.parse(storedRoles).includes(role); } catch (e) { }
        }
        return false;
    };

    const isAuthenticated = () => {
        return !!user || !!sessionStorage.getItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasRole, isAuthenticated, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
