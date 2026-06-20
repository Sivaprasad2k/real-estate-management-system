import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // If already authenticated, redirect away
    if (useAuth().isAuthenticated()) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // Backend expects: { name, email, password }
            await api.post('/auth/register', formData);
            // Registration successful, push them to login so they can authenticate
            navigate('/login', { replace: true });
        } catch (err) {
            setError(
                typeof err.response?.data === 'string'
                    ? err.response.data
                    : "An error occurred during registration."
            );
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
                    <h1 className="text-3xl font-serif text-white mb-2 tracking-wide font-medium">
                        Create Account
                    </h1>
                    <p className="text-sm text-gray-400 font-light">
                        Join our luxury Real Estate Hub today
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

                <form className="space-y-6" onSubmit={handleRegister}>
                    <div>
                        <label className="label-luxury" htmlFor="name">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-luxury w-full placeholder-gray-600 focus:border-brand transition-colors"
                            placeholder="John Doe"
                            required
                            minLength="3"
                            maxLength="50"
                        />
                    </div>

                    <div>
                        <label className="label-luxury" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="input-luxury w-full placeholder-gray-600 focus:border-brand transition-colors"
                            placeholder="you@example.com"
                            required
                            maxLength="50"
                        />
                    </div>

                    <div>
                        <label className="label-luxury" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="input-luxury w-full placeholder-gray-600 focus:border-brand transition-colors"
                            placeholder="••••••••"
                            required
                            minLength="6"
                            maxLength="40"
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
                                Creating Account...
                            </span>
                        ) : "Register"}
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
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand font-medium hover:text-brand-300 transition-colors ml-1">
                        Sign in instead
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

