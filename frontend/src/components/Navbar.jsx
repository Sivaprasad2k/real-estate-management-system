import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ isHome }) => {
    const { isAuthenticated, hasRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navBg = isHome ? "bg-transparent absolute" : "bg-dark border-b border-dark-border sticky";

    return (
        <nav className={`${navBg} text-white h-20 flex items-center w-full top-0 z-50 transition-all duration-300`}>
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 flex justify-between items-center">
                {/* Logo Section */}
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(hasRole('ROLE_ADMIN') ? '/admin-dashboard' : (hasRole('ROLE_MAINTENANCE') ? '/maintenance-dashboard' : '/'))}>
                    {/* SVG Rings Logo recreation */}
                    <div className="relative flex items-center justify-center w-10 h-10 text-brand-400 group-hover:text-brand-500 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 opacity-70 mix-blend-screen absolute -ml-3">
                            <circle cx="12" cy="12" r="8" />
                        </svg>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 opacity-70 mix-blend-screen absolute">
                            <circle cx="12" cy="12" r="8" />
                        </svg>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 opacity-70 mix-blend-screen absolute ml-3">
                            <circle cx="12" cy="12" r="8" />
                        </svg>
                    </div>
                    <span className="text-[17px] font-serif tracking-widest text-white mt-1 uppercase leading-tight">Real Estate<br />Hub</span>
                </div>

                {/* Center Links */}
                <div className="hidden md:flex space-x-12 text-[13px] text-gray-300 tracking-wider font-light uppercase">
                    {hasRole('ROLE_ADMIN') && (
                        <span className="text-brand-400 font-serif italic text-lg tracking-wider normal-case">Admin Portal</span>
                    )}
                    {hasRole('ROLE_MAINTENANCE') && (
                        <span className="text-brand-400 font-serif italic text-lg tracking-wider normal-case">Staff Portal</span>
                    )}
                    {!hasRole('ROLE_ADMIN') && !hasRole('ROLE_MAINTENANCE') && isHome && (
                        <div className="flex items-center gap-12">
                            <a href="/#about" className="hover:text-white transition-colors cursor-pointer tracking-wider font-light uppercase text-[13px]">About</a>
                            <button onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/login')} className="hover:text-white transition-colors tracking-wider font-light uppercase text-[13px]">Properties</button>
                        </div>
                    )}
                </div>

                {/* Right Actions */}
                <div className="flex space-x-6 text-sm font-medium items-center">

                    {!isAuthenticated() && location.pathname !== '/login' && location.pathname !== '/register' && (
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="bg-brand-400 text-dark px-7 py-2.5 rounded-sm font-medium hover:bg-brand-500 transition-colors tracking-wide">Login/Register</Link>
                        </div>
                    )}

                    {isAuthenticated() && (
                        <div className="flex items-center gap-5">
                            {!hasRole('ROLE_ADMIN') && !hasRole('ROLE_MAINTENANCE') && (
                                <Link
                                    to="/profile"
                                    className="border border-brand-400 text-brand-400 font-medium px-6 py-2 rounded-sm hover:bg-brand-400 hover:text-dark transition-colors tracking-wide"
                                >
                                    My Profile
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="border border-brand-400 text-brand-400 font-medium px-6 py-2 rounded-sm hover:bg-brand-400 hover:text-dark transition-colors tracking-wide"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
