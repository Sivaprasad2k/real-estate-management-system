import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
        <div className="relative flex justify-center items-center min-h-[calc(100vh-10rem)] py-12 px-4 overflow-hidden">
            {/* Background luxury ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md bg-[#151515] border border-dark-border/80 rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] p-8 md:p-10 relative overflow-hidden transition-all duration-300 hover:border-brand-500/20">
                {/* Visual top border line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-700 via-brand-500 to-brand-300" />

                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-serif text-white mb-2 tracking-wide font-medium">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-gray-400 font-light">
                        Sign in to access your luxury real estate account
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-950/20 border border-red-900/40 text-red-400 px-4 py-3.5 rounded-lg text-sm flex items-start gap-3 shadow-inner">
                        <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="label-luxury" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-luxury w-full placeholder-gray-600 focus:border-brand transition-colors"
                            placeholder="johnjins123@gmail.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="label-luxury" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-luxury w-full placeholder-gray-600 focus:border-brand transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full mt-8 disabled:opacity-50 py-3.5"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </span>
                        ) : "Sign In"}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dark-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#151515] px-2 text-gray-500 tracking-wider">Secured Access</span>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-brand font-medium hover:text-brand-300 transition-colors ml-1">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

