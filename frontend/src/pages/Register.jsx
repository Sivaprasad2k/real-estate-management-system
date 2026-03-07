import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
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
        <div className="flex justify-center items-center min-h-[calc(100vh-10rem)] py-12">
            <div className="w-full max-w-lg bg-dark/40 backdrop-blur-md border border-dark-border rounded-md shadow-2xl p-8 md:p-10">
                <h1 className="text-3xl font-serif text-center text-white mb-2 tracking-wide">Create an Account</h1>
                <p className="text-center text-gray-400 mb-10 font-light tracking-wide">Join our Real Estate platform to list or rent properties.</p>

                {error && (
                    <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleRegister}>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border border-dark-border bg-[#111] rounded-sm px-4 py-3 focus:outline-none focus:border-brand-400 text-white font-light placeholder-gray-600 transition-colors"
                            placeholder="John Doe"
                            required
                            minLength="3"
                            maxLength="50"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full border border-dark-border bg-[#111] rounded-sm px-4 py-3 focus:outline-none focus:border-brand-400 text-white font-light placeholder-gray-600 transition-colors"
                            placeholder="you@example.com"
                            required
                            maxLength="50"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full border border-dark-border bg-[#111] rounded-sm px-4 py-3 focus:outline-none focus:border-brand-400 text-white font-light placeholder-gray-600 transition-colors"
                            placeholder="••••••••"
                            required
                            minLength="6"
                            maxLength="40"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-400 text-dark font-bold uppercase tracking-widest text-[12px] rounded-sm px-4 py-3.5 hover:bg-brand-500 transition-colors mt-8 disabled:opacity-50"
                    >
                        {isLoading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <p className="text-center text-[13px] text-gray-400 mt-8 pt-6 border-t border-dark-border">
                    Already have an account? <Link to="/login" className="text-brand-400 font-bold uppercase tracking-widest hover:text-brand-300 ml-2">Sign in instead</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
