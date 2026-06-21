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
        { 
            path: '/dashboard', 
            label: 'Overview',
            icon: (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
            )
        },
        { 
            path: '/my-properties', 
            label: 'Listed Properties',
            icon: (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M2.25 21h1.5m18 0h-1.5M4.5 21H12m0 0h1.5m-1.35-17.726c-.146-.073-.312-.114-.486-.114s-.34.041-.486.114L5.22 8.026c-.34.17-.55.513-.55.89v10.125c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V8.916c0-.378-.21-.722-.55-.892L12.65 3.274Z" />
                </svg>
            )
        },
        { 
            path: '/add-property', 
            label: 'List Property',
            icon: (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            )
        },
        { 
            path: '/my-inquiries', 
            label: 'Chats',
            icon: (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
            )
        },
        { 
            path: '/my-maintenance', 
            label: 'Maintenance Requests',
            icon: (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766l.002-.001a1.56 1.56 0 011.883 1.882l-.001.002c-.14.467-.382.89-.766 1.208l-3.03 2.496M11.42 15.17L7.318 11.07M2.25 12a9.75 9.75 0 0015.75 7.75l-3.9-3.9a6 6 0 11-8.522-8.522l3.9 3.9A9.75 9.75 0 002.25 12Z" />
                </svg>
            )
        },
        { 
            path: '/profile', 
            label: 'Profile',
            icon: (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0ZM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
            )
        }
    ];

    return (
        <>
            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className="hidden lg:block w-[260px] shrink-0 relative">
                <div className="bg-dark-card border-r border-dark-border flex flex-col justify-between fixed top-20 left-0 bottom-0 w-[260px] z-30 py-8 px-5">
                    <ul className="space-y-5 font-medium flex-1 pt-4">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 tracking-wider text-xs uppercase font-bold ${isActive
                                            ? 'bg-brand/10 text-brand border-l-4 border-brand shadow-[0_0_15px_rgba(212,175,55,0.08)]'
                                            : 'text-gray-400 hover:bg-dark border-l-4 border-transparent hover:text-white'
                                            }`}
                                    >
                                        <span className={isActive ? 'text-brand' : 'text-gray-500 transition-colors'}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="pt-4 border-t border-dark-border/40">
                        <button
                            onClick={handleLogout}
                            className="w-full px-5 py-3.5 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors tracking-widest text-xs font-bold flex items-center justify-between uppercase"
                        >
                            <span>Logout</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"></path></svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation Bar (hidden on desktop) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.8)] z-40 flex justify-around items-center py-2 px-3">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 transition-all text-center relative py-1 px-2 ${
                                isActive ? 'text-brand' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {isActive && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-brand shadow-[0_0_8px_rgba(212,175,55,0.8)] rounded-full"></span>
                            )}
                            <span className={isActive ? 'text-brand scale-110 transition-transform duration-300 drop-shadow-[0_0_4px_rgba(212,175,55,0.4)]' : 'text-gray-500 transition-colors'}>
                                {item.icon}
                            </span>
                            <span className={`text-[9.5px] uppercase tracking-wider font-semibold truncate max-w-[65px] font-sans ${
                                isActive ? 'text-brand font-bold' : 'text-gray-400'
                            }`}>
                                {item.label.split(' ')[0]}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
};

export default UserSidebar;
