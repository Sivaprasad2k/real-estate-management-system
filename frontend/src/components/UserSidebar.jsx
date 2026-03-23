import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const UserSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = [
        { path: '/dashboard', label: 'Overview' },
        { path: '/my-properties', label: 'Listed Properties' },
        { path: '/add-property', label: 'List Property' },
        { path: '/my-inquiries', label: 'Chats' },
        { path: '/my-maintenance', label: 'Maintenance Request' },
        { path: '/profile', label: 'Profile' }
    ];

    return (
        <aside className="w-[260px] shrink-0">
            <div className="bg-dark-card rounded-xl shadow-md p-5 sticky top-28 border border-dark-border flex flex-col min-h-[calc(100vh-8rem)]">
                <ul className="space-y-4 font-medium flex-1">
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`block px-5 py-3 rounded-lg transition-colors tracking-wide ${location.pathname === item.path
                                    ? 'bg-brand-400/10 text-brand-400 border-l-4 border-brand-400'
                                    : 'text-gray-300 hover:bg-dark border-l-4 border-transparent hover:text-brand-300'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="mt-8 pt-4 border-t border-dark-border">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors tracking-wide font-medium flex items-center justify-between"
                    >
                        <span>Logout</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default UserSidebar;
