import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated, hasRole } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // If user lands here but is already authenticated
    if (isAuthenticated()) {
        if (hasRole("ROLE_ADMIN")) {
            return <Navigate to="/admin-dashboard" replace />;
        } else if (hasRole("ROLE_MAINTENANCE")) {
            return <Navigate to="/maintenance-dashboard" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    // Define from object handling redirects mapping properly into react-router-dom flow.
    const from = location.state?.from?.pathname || '/dashboard';

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });

            // Assume the backend returns a token in the structure { token: "..." }
            if (response.data && response.data.token) {
                const roles = response.data.roles || [];
                login(response.data.token, roles);

                if (roles.includes("ROLE_ADMIN")) {
                    navigate('/admin-dashboard', { replace: true });
                } else if (roles.includes("ROLE_MAINTENANCE")) {
                    navigate('/maintenance-dashboard', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            }
        } catch (err) {
            const errorData = err.response?.data;
            setError(typeof errorData === 'string' ? errorData : "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
            <div className="w-full max-w-md bg-dark/40 backdrop-blur-md border border-dark-border rounded-md shadow-2xl p-8 md:p-10">
                <h1 className="text-3xl font-serif text-center text-white mb-8 tracking-wide">Welcome Back</h1>

                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-dark-border bg-[#111] rounded-sm px-4 py-3 focus:outline-none focus:border-brand-400 text-white font-light placeholder-gray-600 transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-dark-border bg-[#111] rounded-sm px-4 py-3 focus:outline-none focus:border-brand-400 text-white font-light placeholder-gray-600 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-400 text-dark font-bold uppercase tracking-widest text-[12px] rounded-sm px-4 py-3.5 hover:bg-brand-500 transition-colors mt-8 disabled:opacity-50"
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                <p className="text-center text-[13px] text-gray-400 mt-8 pt-6 border-t border-dark-border">
                    Don't have an account? <Link to="/register" className="text-brand-400 font-bold uppercase tracking-widest hover:text-brand-300 ml-2">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
