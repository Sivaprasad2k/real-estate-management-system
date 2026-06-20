import React from 'react';
import Navbar from './Navbar';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <div className="min-h-screen bg-dark text-white font-sans flex flex-col">
            <Navbar isHome={isHome} />
            <main className={isHome ? "w-full flex-1 flex flex-col" : "flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 pt-14 pb-20 lg:pb-12"}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
