import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Navbar = ({ isHome }) => {
    const { isAuthenticated, hasRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchNotifications();
            // Fetch periodically every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated()]);

    const fetchNotifications = async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get('/notifications'),
                api.get('/notifications/unread-count')
            ]);
            setNotifications(notifRes.data);
            setUnreadCount(countRes.data.count);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navBg = isHome ? "bg-transparent absolute" : "bg-dark border-b border-dark-border sticky";

    return (
        <nav className={`${navBg} text-white h-20 flex items-center w-full top-0 z-50 transition-all duration-300`}>
            <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 flex justify-between items-center">
                {/* Logo Section / Back Button */}
                <div className="flex items-center gap-4 cursor-pointer group relative pl-2 transition-all duration-300 hover:translate-x-2" onClick={() => navigate(-1)} title="Go Back">
                    {/* Fancy Back Arrow (appears on hover) */}
                    <div className="absolute -left-6 opacity-0 group-hover:opacity-100 transition-all duration-300 text-brand-400 transform group-hover:-translate-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    </div>

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
                    <span className="text-[17px] font-serif tracking-widest text-white mt-1 uppercase leading-tight group-hover:text-brand-300 transition-colors">Real Estate<br />Hub</span>
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
                        <div className="flex items-center gap-5 relative">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-dark-muted hover:text-brand transition-colors relative focus:outline-none cursor-pointer group"
                                >
                                    <svg className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[8px] items-center justify-center text-white font-bold border border-[#0B0B0B]">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {showNotifications && (
                                    <div className="absolute right-[-12px] sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-3 z-50 animate-fade-in overflow-hidden">
                                        <div className="px-5 py-3 border-b border-dark-border/60 flex justify-between items-center bg-[#0B0B0B]/30">
                                            <h3 className="font-semibold text-white tracking-widest text-[11px] uppercase">Notification center</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllAsRead} className="text-[10px] text-brand hover:text-brand-300 uppercase tracking-widest font-bold cursor-pointer">Mark all read</button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto divide-y divide-dark-border/40 scrollbar-thin">
                                            {notifications.length === 0 ? (
                                                /* Phase 10: Empty State */
                                                <div className="px-5 py-8 text-center text-dark-muted text-xs italic">
                                                    No notification alerts registered yet.
                                                </div>
                                            ) : (
                                                notifications.map(notif => {
                                                    const getNotifIcon = (type) => {
                                                        switch (type) {
                                                            case 'SALE':
                                                                return (
                                                                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0a3.42 3.42 0 001.946.806" /></svg>
                                                                );
                                                            case 'RENT':
                                                                return (
                                                                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3" /></svg>
                                                                );
                                                            case 'MAINTENANCE':
                                                                return (
                                                                    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066" /></svg>
                                                                );
                                                            default:
                                                                return (
                                                                    <svg className="w-4 h-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11" /></svg>
                                                                );
                                                        }
                                                    };

                                                    return (
                                                        <div
                                                            key={notif.id}
                                                            className={`px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-start gap-4 ${notif.read ? 'opacity-65' : 'bg-brand/5'}`}
                                                            onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                                        >
                                                            <div className={`p-2 rounded-lg bg-dark border border-dark-border mt-0.5 shrink-0`}>
                                                                {getNotifIcon(notif.type)}
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] font-bold tracking-wider uppercase text-brand">
                                                                        {notif.type || 'SYSTEM'}
                                                                    </span>
                                                                    <span className="text-[9px] text-dark-muted font-light">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-300 leading-relaxed font-light">{notif.message}</p>
                                                            </div>
                                                            {!notif.read && (
                                                                <span className="h-2 w-2 rounded-full bg-brand shrink-0 mt-2"></span>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!hasRole('ROLE_ADMIN') && !hasRole('ROLE_MAINTENANCE') ? null : (
                                <button
                                    onClick={handleLogout}
                                    className="border border-brand-400 text-brand-400 font-medium px-6 py-2 rounded-sm hover:bg-brand-400 hover:text-dark transition-colors tracking-wide"
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
