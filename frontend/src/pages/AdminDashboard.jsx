import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MAINTENANCE_SKILLS = ['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'HVAC', 'GENERAL', 'APPLIANCE'];

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [stats, setStats] = useState({ totalUsers: 0, totalProperties: 0, activeReports: 0, activeTickets: 0 });
    const [properties, setProperties] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form State for Maintenance Staff
    const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', skills: [] });
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview') {
                const res = await api.get('/admin/stats');
                setStats(res.data);
            } else if (activeTab === 'properties') {
                const res = await api.get('/admin/properties');
                setProperties(res.data);
            } else if (activeTab === 'users') {
                const res = await api.get('/admin/users');
                setUsersList(res.data);
            } else if (activeTab === 'maintenance') {
                const res = await api.get('/admin/maintenance');
                setTickets(res.data);
            }
        } catch (err) {
            console.error("Failed to load admin data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveProperty = async (id) => {
        try {
            await api.put(`/admin/properties/${id}/approve`);
            setProperties(properties.map(p => p.id === id ? { ...p, reportCount: 0 } : p));
        } catch (err) {
            alert("Approval failed");
        }
    };

    const handleRejectProperty = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this property?")) return;
        try {
            await api.put(`/admin/properties/${id}/reject`);
            setProperties(properties.filter(p => p.id !== id));
        } catch (err) {
            alert("Rejection failed");
        }
    };

    const handleToggleBan = async (userId, currentStatus) => {
        try {
            if (currentStatus) {
                await api.put(`/admin/users/${userId}/unban`);
            } else {
                await api.put(`/admin/users/${userId}/ban`);
            }
            setUsersList(usersList.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
        } catch (err) {
            alert("Failed to update user status");
        }
    };

    const handleRegisterStaff = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await api.post('/admin/maintenance-staff', staffForm);
            alert("Maintenance staff registered successfully!");
            setStaffForm({ name: '', email: '', password: '', skills: [] });
            setShowStaffForm(false);
            fetchData(); // Refresh users list
        } catch (err) {
            alert(err.response?.data || "Failed to register staff");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSkillToggle = (skill) => {
        setStaffForm(prev => {
            const skills = prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill];
            return { ...prev, skills };
        });
    };

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <aside className="w-[240px] shrink-0">
                <div className="bg-dark/40 backdrop-blur-md rounded-xl border border-dark-border p-5 sticky top-28">
                    <h3 className="text-gray-500 font-bold mb-4 ml-2 uppercase text-[11px] tracking-widest">Admin Controls</h3>
                    <ul className="space-y-1 font-medium text-[14px]">
                        <li>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full text-left px-4 py-2.5 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-brand-400/10 text-brand-400 border-l-2 border-brand-400' : 'text-gray-400 hover:bg-dark/50 hover:text-brand-300 border-l-2 border-transparent'}`}
                            >
                                System Overview
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('properties')}
                                className={`w-full text-left px-4 py-2.5 rounded-md transition-colors flex justify-between items-center ${activeTab === 'properties' ? 'bg-brand-400/10 text-brand-400 border-l-2 border-brand-400' : 'text-gray-400 hover:bg-dark/50 hover:text-brand-300 border-l-2 border-transparent'}`}
                            >
                                Global Properties
                                {stats.activeReports > 0 && activeTab !== 'properties' && (
                                    <span className="bg-red-900/60 border border-red-500/30 text-red-200 text-[10px] px-2 py-0.5 rounded-sm">{stats.activeReports}</span>
                                )}
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('maintenance')}
                                className={`w-full text-left px-4 py-2.5 rounded-md transition-colors ${activeTab === 'maintenance' ? 'bg-brand-400/10 text-brand-400 border-l-2 border-brand-400' : 'text-gray-400 hover:bg-dark/50 hover:text-brand-300 border-l-2 border-transparent'}`}
                            >
                                Maintenance Details
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`w-full text-left px-4 py-2.5 rounded-md transition-colors ${activeTab === 'users' ? 'bg-brand-400/10 text-brand-400 border-l-2 border-brand-400' : 'text-gray-400 hover:bg-dark/50 hover:text-brand-300 border-l-2 border-transparent'}`}
                            >
                                User Management
                            </button>
                        </li>
                    </ul>
                </div>
            </aside>

            <main className="flex-1">
                <h1 className="text-3xl font-serif text-white mb-8 tracking-wide">Admin Dashboard</h1>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-400"></div>
                    </div>
                ) : (
                    <>
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                                <div className="bg-dark/40 border border-dark-border rounded-md p-6 shadow-lg backdrop-blur-sm">
                                    <h3 className="text-gray-500 text-[11px] uppercase tracking-widest font-bold mb-2">Total Users</h3>
                                    <p className="text-4xl font-serif text-white">{stats.totalUsers}</p>
                                </div>
                                <div className="bg-dark/40 border border-dark-border rounded-md p-6 shadow-lg backdrop-blur-sm">
                                    <h3 className="text-gray-500 text-[11px] uppercase tracking-widest font-bold mb-2">Total Properties</h3>
                                    <p className="text-4xl font-serif text-brand-400">{stats.totalProperties}</p>
                                </div>
                                <div className="bg-dark/40 border border-red-900/30 rounded-md p-6 shadow-lg backdrop-blur-sm">
                                    <h3 className="text-red-500/80 text-[11px] uppercase tracking-widest font-bold mb-2">Active Reports</h3>
                                    <p className="text-4xl font-serif text-red-400">{stats.activeReports}</p>
                                </div>
                                <div className="bg-dark/40 border border-dark-border rounded-md p-6 shadow-lg backdrop-blur-sm">
                                    <h3 className="text-gray-500 text-[11px] uppercase tracking-widest font-bold mb-2">Maintenance Tickets</h3>
                                    <p className="text-4xl font-serif text-gray-300">{stats.activeTickets}</p>
                                </div>
                            </div>
                        )}

                        {/* Global Properties Tab */}
                        {activeTab === 'properties' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center border-b border-dark-border pb-4 mb-6">
                                    <h2 className="text-2xl font-serif text-white tracking-wide">Global Properties Directory</h2>
                                </div>
                                {properties.length === 0 ? (
                                    <div className="bg-dark/40 backdrop-blur-md p-10 rounded-md text-center border border-dark-border">
                                        <p className="text-gray-400 tracking-wider font-light">No properties exist on the platform.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {properties.map(property => (
                                            <div key={property.id} className={`bg-dark/40 backdrop-blur-sm rounded-md shadow-lg overflow-hidden border flex flex-col ${property.reportCount > 0 ? 'border-red-900/50' : 'border-dark-border'}`}>
                                                <div className="h-48 relative">
                                                    {property.images && property.images.length > 0 ? (
                                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover opacity-80" />
                                                    ) : (
                                                        <div className="bg-[#111] w-full h-full flex items-center justify-center text-gray-500 font-light text-xs tracking-widest">[NO IMAGE]</div>
                                                    )}
                                                    {property.reportCount > 0 && (
                                                        <span className="absolute top-3 right-3 bg-red-900/60 text-red-200 border border-red-500/30 backdrop-blur-md px-3 py-1 rounded-sm text-[10px] uppercase font-semibold tracking-wider animate-pulse">
                                                            FLAGGED: {property.reportCount} Reports
                                                        </span>
                                                    )}
                                                    {property.status && (
                                                        <span className="absolute bottom-3 left-3 bg-dark/60 backdrop-blur-md border border-gray-600/50 text-gray-300 px-3 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider">
                                                            {property.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <h3 className="text-xl font-serif text-brand-400 mb-2 line-clamp-1">{property.title}</h3>
                                                    <p className="text-sm text-gray-400 mb-6 line-clamp-2 leading-relaxed font-light">{property.description}</p>

                                                    <div className="mt-auto flex gap-4">
                                                        {property.reportCount > 0 && (
                                                            <button
                                                                onClick={() => handleApproveProperty(property.id)}
                                                                className="flex-1 bg-transparent hover:bg-dark-border border border-brand-400 text-brand-400 py-2.5 rounded-sm text-[11px] font-bold tracking-widest uppercase transition-colors"
                                                            >
                                                                Dismiss Flags
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleRejectProperty(property.id)}
                                                            className="flex-1 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 py-2.5 rounded-sm text-[11px] font-bold tracking-widest uppercase transition-colors"
                                                        >
                                                            Delete Property
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Maintenance Tab */}
                        {activeTab === 'maintenance' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-semibold text-gray-200 border-b border-dark-border pb-2">Global Maintenance Requests</h2>
                                {tickets.length === 0 ? (
                                    <div className="bg-dark-card p-8 rounded-xl text-center border border-dark-border">
                                        <p className="text-gray-400">No maintenance tickets have been submitted.</p>
                                    </div>
                                ) : (
                                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-dark border-b border-dark-border text-gray-400 text-sm">
                                                    <th className="p-4 font-medium">Issue</th>
                                                    <th className="p-4 font-medium">Severity</th>
                                                    <th className="p-4 font-medium">Status</th>
                                                    <th className="p-4 font-medium">Date Created</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-dark-border">
                                                {tickets.map(ticket => (
                                                    <tr key={ticket.id} className="hover:bg-dark/50 transition-colors">
                                                        <td className="p-4 text-gray-200">
                                                            <div className="font-medium">{ticket.title}</div>
                                                            <div className="text-xs text-gray-500 line-clamp-1">{ticket.description}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ticket.severity === 'HIGH' ? 'bg-red-900/30 text-red-400' :
                                                                ticket.severity === 'MEDIUM' ? 'bg-orange-900/30 text-orange-400' :
                                                                    'bg-green-900/30 text-green-400'
                                                                }`}>
                                                                {ticket.severity}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-brand-300 text-sm font-medium">{ticket.status}</span>
                                                        </td>
                                                        <td className="p-4 text-gray-400 text-sm">
                                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* User Management Tab */}
                        {activeTab === 'users' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex justify-between items-center border-b border-dark-border pb-4 mb-8">
                                    <h2 className="text-2xl font-serif text-white tracking-wide">User & Staff Management</h2>
                                    <button
                                        onClick={() => setShowStaffForm(!showStaffForm)}
                                        className="bg-brand-400 hover:bg-brand-500 text-dark px-6 py-2.5 rounded-sm text-[12px] uppercase tracking-widest font-bold transition-colors shadow-sm"
                                    >
                                        {showStaffForm ? 'Cancel Registration' : '+ Register Staff'}
                                    </button>
                                </div>

                                {showStaffForm && (
                                    <div className="bg-dark/40 backdrop-blur-md border border-brand-400/30 rounded-md p-8 shadow-2xl mb-10">
                                        <h3 className="text-xl font-serif text-brand-400 mb-6">Register New Maintenance Worker</h3>
                                        <form onSubmit={handleRegisterStaff} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                                                <input required type="text" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light" placeholder="John Doe" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                                                <input required type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light" placeholder="john@maintenance.com" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
                                                <div className="flex gap-4">
                                                    <input required type="text" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light" placeholder="SecurePass!" />
                                                    <button type="submit" disabled={formLoading || staffForm.skills.length === 0} className="shrink-0 bg-brand-400 hover:bg-brand-500 text-dark px-8 py-3 rounded-sm font-bold tracking-widest uppercase text-[12px] transition-colors disabled:opacity-50">
                                                        {formLoading ? 'Creating...' : 'Register'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="md:col-span-3 mt-2">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Technical Skills (Required for Auto-Assignment)</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {MAINTENANCE_SKILLS.map(skill => (
                                                        <button
                                                            key={skill}
                                                            type="button"
                                                            onClick={() => handleSkillToggle(skill)}
                                                            className={`px-4 py-2 rounded-sm text-[11px] font-bold tracking-widest uppercase transition-colors border ${staffForm.skills.includes(skill) ? 'bg-brand-400 text-dark border-brand-400' : 'bg-[#111] text-gray-400 border-dark-border hover:border-gray-500'}`}
                                                        >
                                                            {skill}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="bg-dark/40 backdrop-blur-md border border-dark-border rounded-md overflow-hidden shadow-xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#111] border-b border-dark-border text-gray-500 text-[11px] uppercase tracking-widest">
                                                <th className="p-5 font-bold">Name</th>
                                                <th className="p-5 font-bold">Email</th>
                                                <th className="p-5 font-bold">Joined</th>
                                                <th className="p-5 font-bold">Roles</th>
                                                <th className="p-5 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-dark-border">
                                            {usersList.map(u => (
                                                <tr key={u.id} className="hover:bg-dark/60 transition-colors">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-sm bg-brand-400/10 border border-brand-400/20 text-brand-400 flex items-center justify-center font-serif text-lg uppercase">
                                                                {u.name ? u.name.charAt(0) : 'U'}
                                                            </div>
                                                            <span className="text-gray-200 font-medium tracking-wide">{u.name || 'Unnamed'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-gray-400 text-sm font-light">{u.email}</td>
                                                    <td className="p-5 text-gray-400 text-sm font-light">
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex gap-2 flex-wrap">
                                                            {u.roles && u.roles.map(role => (
                                                                <span key={role} className={`px-3 py-1.5 rounded-sm text-[9px] uppercase tracking-widest font-bold border ${role === 'ROLE_ADMIN' ? 'bg-red-900/20 text-red-300 border-red-900/50' : role === 'ROLE_MAINTENANCE' ? 'bg-orange-900/20 text-orange-300 border-orange-900/50' : 'bg-brand-400/10 text-brand-300 border-brand-400/30'}`}>
                                                                    {role.replace('ROLE_', '')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right">
                                                        {u.id !== user?.id ? (
                                                            <button
                                                                onClick={() => handleToggleBan(u.id, u.banned)}
                                                                className={`px-4 py-2 rounded-sm text-[10px] uppercase font-bold tracking-widest transition-colors border ${u.banned
                                                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
                                                                    : 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border-red-900/50'
                                                                    }`}
                                                            >
                                                                {u.banned ? 'UNBAN' : 'BAN ALONG'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-brand-400/50 text-[10px] uppercase tracking-widest font-bold border border-brand-400/20 px-4 py-2 rounded-sm">Current User</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {usersList.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-10 text-center text-gray-500 tracking-wider font-light">
                                                        No users found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
