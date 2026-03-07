import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const UserSidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', label: 'Overview' },
        { path: '/my-properties', label: 'My Listed Properties' },
        { path: '/add-property', label: 'Add Property' },
        { path: '/my-inquiries', label: 'Messages' },
        { path: '/my-maintenance', label: 'My Maintenance Requests' }
    ];

    return (
        <aside className="w-[260px] shrink-0">
            <div className="bg-dark-card rounded-xl shadow-md p-5 sticky top-28 border border-dark-border">
                <ul className="space-y-4 font-medium">
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
            </div>
        </aside>
    );
};

export default UserSidebar;
