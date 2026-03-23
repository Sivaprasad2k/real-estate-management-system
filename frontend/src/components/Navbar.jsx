import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Navbar = ({ isHome }) => {
    const { isAuthenticated, hasRole, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        purpose: searchParams.get('purpose') || '',
        sortBy: searchParams.get('sortBy') || 'recommended'
    });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        setFilters({
            keyword: searchParams.get('keyword') || '',
            purpose: searchParams.get('purpose') || '',
            sortBy: searchParams.get('sortBy') || 'recommended'
        });
    }, [searchParams]);

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

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (filters.keyword) params.set('keyword', filters.keyword);
        if (filters.purpose) params.set('purpose', filters.purpose);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        navigate(`/dashboard?${params.toString()}`);
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

                {/* Global Search Bar */}
                {isAuthenticated() && !hasRole('ROLE_ADMIN') && !hasRole('ROLE_MAINTENANCE') && (
                    <div className="flex-1 max-w-4xl mx-8 hidden xl:block">
                        <form onSubmit={handleSearch} className="flex flex-row items-center gap-2">
                            <input
                                type="text"
                                placeholder="Search by keyword or city..."
                                className="bg-[#111] border border-dark-border rounded px-4 py-2 text-white focus:outline-none focus:border-brand-400 flex-1 text-xs font-light transition-colors"
                                value={filters.keyword}
                                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                            />
                            <select
                                className="bg-[#111] border border-dark-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-400 text-xs font-light w-28 transition-colors"
                                value={filters.purpose}
                                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                            >
                                <option value="">Any Purpose</option>
                                <option value="RENT">Rent</option>
                                <option value="BUY">Sale</option>
                            </select>
                            <select
                                className="bg-[#111] border border-dark-border rounded px-3 py-2 text-white focus:outline-none focus:border-brand-400 text-xs font-light w-36 transition-colors"
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            >
                                <option value="recommended">Recommended</option>
                                <option value="recent">Most Recent</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                            <button type="submit" className="bg-brand-400 text-dark px-6 py-2 rounded font-bold text-xs tracking-wide transition-all duration-300 hover:bg-brand-300 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(218,165,32,0.4)] hover:shadow-brand-400/30 active:transform-none">
                                Search
                            </button>
                        </form>
                    </div>
                )}

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
                                    className="p-2 text-gray-300 hover:text-white transition-colors relative focus:outline-none"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white font-bold border-2 border-dark">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-lg shadow-2xl py-2 z-50 animate-fade-in overflow-hidden">
                                        <div className="px-4 py-2 border-b border-dark-border flex justify-between items-center bg-black/20">
                                            <h3 className="font-semibold text-white tracking-widest text-xs uppercase">Notifications</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={handleMarkAllAsRead} className="text-[10px] text-brand-400 hover:text-brand-300 uppercase tracking-wider font-bold">Mark all read</button>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-gray-500 text-sm italic">
                                                    No notifications yet.
                                                </div>
                                            ) : (
                                                notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        className={`px-4 py-3 border-b border-dark-border/50 hover:bg-white/5 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-brand-900/10'}`}
                                                        onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${notif.type === 'SALE' ? 'bg-blue-900/40 text-blue-400' : notif.type === 'MAINTENANCE' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400'}`}>
                                                                {notif.type || 'NOTICE'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className={`text-sm mt-2 ${notif.read ? 'text-gray-400' : 'text-gray-200 font-medium'}`}>{notif.message}</p>
                                                    </div>
                                                ))
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
