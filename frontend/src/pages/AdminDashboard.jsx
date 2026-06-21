import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MAINTENANCE_SKILLS = ['PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'GENERAL', 'CARPENTRY', 'CLEANING'];

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [stats, setStats] = useState({ 
        totalUsers: 0, 
        totalProperties: 0, 
        activeReports: 0, 
        activeTickets: 0,
        activeRentals: 0,
        activeSales: 0 
    });
    const [properties, setProperties] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [maintenanceAnalytics, setMaintenanceAnalytics] = useState(null);
    const [suspiciousLogs, setSuspiciousLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Form State for Maintenance Staff Registration
    const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', skills: [] });
    const [showStaffForm, setShowStaffForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Modal State for Editing Staff Skills
    const [editingStaff, setEditingStaff] = useState(null);
    const [tempSkills, setTempSkills] = useState([]);
    const [isSavingSkills, setIsSavingSkills] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'overview') {
                const [statsRes, analyticsRes, logsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/maintenance/analytics'),
                    api.get('/admin/suspicious-logs')
                ]);
                setStats(statsRes.data);
                setMaintenanceAnalytics(analyticsRes.data);
                setSuspiciousLogs(logsRes.data.slice(0, 5));
            } else if (activeTab === 'properties') {
                const res = await api.get('/admin/properties');
                setProperties(res.data);
            } else if (activeTab === 'flagged') {
                const res = await api.get('/admin/properties/flagged');
                setProperties(res.data);
            } else if (activeTab === 'users') {
                const res = await api.get('/admin/users');
                setUsersList(res.data);
            } else if (activeTab === 'maintenance') {
                const res = await api.get('/admin/maintenance');
                setTickets(res.data);
                const anaRes = await api.get('/admin/maintenance/analytics');
                setMaintenanceAnalytics(anaRes.data);
            } else if (activeTab === 'fraud') {
                const res = await api.get('/admin/suspicious-logs');
                setSuspiciousLogs(res.data);
            } else if (activeTab === 'transactions') {
                const res = await api.get('/admin/properties');
                const completed = res.data.filter(p => p.status === 'SOLD' || p.status === 'RENTED');
                setProperties(completed);
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
            // Update stats after dismissing flags
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            alert("Approval failed");
        }
    };

    const handleRejectProperty = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this property?")) return;
        try {
            await api.put(`/admin/properties/${id}/reject`);
            setProperties(properties.filter(p => p.id !== id));
            // Update stats after deleting property
            const statsRes = await api.get('/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            alert("Rejection failed");
        }
    };

    const handleToggleFeatured = async (id, currentFeatured) => {
        try {
            await api.put(`/admin/properties/${id}/featured?featured=${!currentFeatured}`);
            setProperties(properties.map(p => p.id === id ? { ...p, promoted: !currentFeatured } : p));
        } catch (err) {
            alert("Failed to toggle featured status");
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

    const openSkillsEditor = (staffUser) => {
        setEditingStaff(staffUser);
        setTempSkills(staffUser.skills || []);
    };

    const handleTempSkillToggle = (skill) => {
        setTempSkills(prev => 
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const handleSaveSkills = async () => {
        if (!editingStaff) return;
        if (tempSkills.length === 0) {
            alert("At least one technical skill is required to save staff settings.");
            return;
        }
        setIsSavingSkills(true);
        try {
            const res = await api.put(`/admin/users/${editingStaff.id}/skills`, tempSkills);
            setUsersList(usersList.map(u => u.id === editingStaff.id ? { ...u, skills: tempSkills } : u));
            setEditingStaff(null);
            alert("Staff skills updated successfully!");
        } catch (err) {
            alert(err.response?.data || "Failed to update staff skills");
        } finally {
            setIsSavingSkills(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-8rem)]">
            {/* Sidebar Controls */}
            <aside className="w-full lg:w-[260px] shrink-0 min-w-0 overflow-hidden">
                <div className="bg-dark-card rounded-xl p-4 sm:p-5 border border-dark-border flex flex-row overflow-x-auto whitespace-nowrap lg:flex-col gap-2 hidden-scroll w-full max-w-full">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest px-4 mb-2 hidden lg:block">Controls</div>
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'overview' ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /></svg>
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('flagged')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center justify-between gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'flagged' ? 'bg-red-500/10 text-red-400 border-l-4 border-red-500' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <span className="flex items-center gap-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Approval Queue
                        </span>
                        {stats.activeReports > 0 && (
                            <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-500/30">{stats.activeReports}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('properties')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'properties' ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        All Properties
                    </button>
                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'maintenance' ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Maintenance Jobs
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'users' ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Users & Staff
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'transactions' ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Sales & Rentals
                    </button>
                    <button
                        onClick={() => setActiveTab('fraud')}
                        className={`text-left px-5 py-3 rounded-lg transition-all flex items-center gap-3 tracking-wide font-medium text-sm shrink-0 w-auto lg:w-full ${activeTab === 'fraud' ? 'bg-brand/10 text-brand border-l-4 border-brand' : 'text-gray-400 hover:bg-dark/40 border-l-4 border-transparent hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Security Logs
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1">
                {isLoading ? (
                    <div className="flex justify-center items-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Title Header */}
                        <div className="border-b border-dark-border pb-4 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-serif text-white tracking-wide">Administrator Dashboard</h1>
                                <p className="text-brand text-xs uppercase tracking-widest font-bold mt-1">Platform Operations Control</p>
                            </div>
                            <span className="text-xs text-gray-500 font-mono hidden md:inline-block">Logged as: {user?.email}</span>
                        </div>

                        {/* TAB CONTENT: OVERVIEW */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Stats Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                                    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand/40 transition-all duration-300 group">
                                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Users</div>
                                        <div className="text-3xl font-serif text-white group-hover:text-brand transition-colors">{stats.totalUsers}</div>
                                    </div>
                                    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand/40 transition-all duration-300 group">
                                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Properties</div>
                                        <div className="text-3xl font-serif text-white group-hover:text-brand transition-colors">{stats.totalProperties}</div>
                                    </div>
                                    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand/40 transition-all duration-300 group">
                                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 text-blue-400">Active Rentals</div>
                                        <div className="text-3xl font-serif text-blue-400 group-hover:text-brand transition-colors">{stats.activeRentals}</div>
                                    </div>
                                    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand/40 transition-all duration-300 group">
                                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 text-green-400">Active Sales</div>
                                        <div className="text-3xl font-serif text-green-400 group-hover:text-brand transition-colors">{stats.activeSales}</div>
                                    </div>
                                    <div className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand/40 transition-all duration-300 group">
                                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 text-yellow-500">Active Tickets</div>
                                        <div className="text-3xl font-serif text-yellow-500 group-hover:text-brand transition-colors">{stats.activeTickets}</div>
                                    </div>
                                    <div className={`bg-dark-card border rounded-xl p-5 transition-all duration-300 group ${stats.activeReports > 0 ? 'border-red-500/30 hover:border-red-500' : 'border-dark-border'}`}>
                                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 text-red-400">Flagged Properties</div>
                                        <div className="text-3xl font-serif text-red-500">{stats.activeReports}</div>
                                    </div>
                                </div>

                                {/* REPORTS DASHBOARD SECTION */}
                                <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-8">
                                    <div>
                                        <h2 className="text-xl font-serif text-white tracking-wide">Platform Reports Dashboard</h2>
                                        <p className="text-xs text-gray-500 mt-1">Sales, rentals, and maintenance workload analysis</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Sales vs Rentals Trend */}
                                        <div className="bg-dark/40 p-5 rounded-lg border border-dark-border/60 flex flex-col justify-between space-y-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-300">Transaction Balance</h3>
                                                <p className="text-xs text-gray-500 mt-1">Completed / active transactional records ratio</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-mono">
                                                    <span className="text-green-400">Sales ({stats.activeSales})</span>
                                                    <span className="text-blue-400">Rentals ({stats.activeRentals})</span>
                                                </div>
                                                <div className="w-full h-3 bg-dark rounded-full overflow-hidden flex border border-dark-border">
                                                    <div 
                                                        style={{ width: `${stats.activeSales + stats.activeRentals > 0 ? (stats.activeSales / (stats.activeSales + stats.activeRentals)) * 100 : 50}%` }} 
                                                        className="h-full bg-green-500 transition-all duration-500"
                                                    ></div>
                                                    <div 
                                                        style={{ width: `${stats.activeSales + stats.activeRentals > 0 ? (stats.activeRentals / (stats.activeSales + stats.activeRentals)) * 100 : 50}%` }} 
                                                        className="h-full bg-blue-500 transition-all duration-500"
                                                    ></div>
                                                </div>
                                                <p className="text-[10px] text-gray-500 leading-normal">
                                                    Total transactions tracked: <span className="text-white font-semibold">{stats.activeSales + stats.activeRentals}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Maintenance Workload */}
                                        <div className="bg-dark/40 p-5 rounded-lg border border-dark-border/60 flex flex-col justify-between space-y-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-300">Maintenance Load</h3>
                                                <p className="text-xs text-gray-500 mt-1">Current ticket distribution and resolution efficiency</p>
                                            </div>
                                            {maintenanceAnalytics ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-400">Open Tickets</span>
                                                        <span className="font-semibold text-white">{maintenanceAnalytics.openTickets}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-400">Assigned Tickets</span>
                                                        <span className="font-semibold text-orange-400">{maintenanceAnalytics.assignedTickets}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-400">Completed Tickets</span>
                                                        <span className="font-semibold text-green-400">{maintenanceAnalytics.completedTickets}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-dark rounded-full overflow-hidden border border-dark-border">
                                                        <div 
                                                            style={{ width: `${maintenanceAnalytics.totalTickets > 0 ? (maintenanceAnalytics.completedTickets / maintenanceAnalytics.totalTickets) * 100 : 0}%` }} 
                                                            className="h-full bg-green-500 transition-all duration-500"
                                                        ></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-500 italic">No maintenance data available.</div>
                                            )}
                                        </div>

                                        {/* Platform Resolution Efficiency */}
                                        <div className="bg-dark/40 p-5 rounded-lg border border-dark-border/60 flex flex-col justify-between space-y-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-300">System Activity Status</h3>
                                                <p className="text-xs text-gray-500 mt-1">Platform general operating logs</p>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Pending Flags</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stats.activeReports > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                                        {stats.activeReports > 0 ? 'Needs Attention' : 'Secure'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Active Properties ratio</span>
                                                    <span className="text-white font-semibold font-mono">
                                                        {stats.totalProperties > 0 ? `${Math.round(((stats.activeRentals + stats.activeSales) / stats.totalProperties) * 100)}%` : '0%'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400">Suspicious Incidents</span>
                                                    <span className="text-red-400 font-semibold">{suspiciousLogs.length}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Suspicious Activity Summary Panel */}
                                <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-serif text-white">Recent Security Operations</h3>
                                        <button onClick={() => setActiveTab('fraud')} className="text-xs text-brand hover:underline font-semibold uppercase tracking-wider">View Full Logs &rarr;</button>
                                    </div>
                                    {suspiciousLogs.length === 0 ? (
                                        <p className="text-xs text-gray-500 italic">No suspicious actions have been recorded on the platform.</p>
                                    ) : (
                                        <div className="divide-y divide-dark-border">
                                            {suspiciousLogs.map(log => (
                                                <div key={log.id} className="py-3 flex justify-between items-center text-xs">
                                                    <div className="space-y-1">
                                                        <p className="text-gray-300 font-medium">{log.reason}</p>
                                                        <p className="text-gray-500 font-mono text-[10px]">User: {log.userId} | Prop: {log.propertyId}</p>
                                                    </div>
                                                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT: APPROVAL QUEUE */}
                        {activeTab === 'flagged' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-serif text-white">Property Approval Queue</h2>
                                        <p className="text-xs text-gray-500 mt-1">Review flagged listings report logs and take administrative actions</p>
                                    </div>
                                </div>
                                {properties.length === 0 ? (
                                    <div className="bg-dark-card p-12 text-center rounded-xl border border-dark-border">
                                        <p className="text-gray-400 font-light tracking-wide">No pending flags! The listings queue is completely clean.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {properties.map(property => (
                                            <div key={property.id} className="bg-dark-card rounded-lg border border-red-500/30 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group">
                                                <div className="h-48 relative overflow-hidden bg-[#111] shrink-0">
                                                    {property.images && property.images.length > 0 ? (
                                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs tracking-widest bg-dark font-light">[NO IMAGE]</div>
                                                    )}
                                                    <span className="absolute top-4 right-4 bg-red-500/90 text-dark px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest shadow-md">
                                                        FLAGGED: {property.reportCount} Reports
                                                    </span>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-serif text-white font-medium mb-2 group-hover:text-brand transition-colors">{property.title}</h3>
                                                        <p className="text-xs text-gray-400 font-mono mb-4">Location: {property.city}, {property.state} | ID: {property.id}</p>
                                                        <p className="text-sm text-gray-400 font-light line-clamp-3 leading-relaxed mb-6">{property.description}</p>
                                                    </div>
                                                    <div className="flex gap-4 border-t border-dark-border pt-4">
                                                        <button
                                                            onClick={() => handleApproveProperty(property.id)}
                                                            className="flex-1 bg-transparent hover:bg-brand/10 border border-brand text-brand py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all"
                                                        >
                                                            Dismiss Flags
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProperty(property.id)}
                                                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all"
                                                        >
                                                            Delete Listing
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: ALL PROPERTIES */}
                        {activeTab === 'properties' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-serif text-white">Global Properties Directory</h2>
                                        <p className="text-xs text-gray-500 mt-1">Manage listings featured promo state or remove properties from database</p>
                                    </div>
                                </div>
                                {properties.length === 0 ? (
                                    <div className="bg-dark-card p-12 text-center rounded-xl border border-dark-border">
                                        <p className="text-gray-400">No properties exist on the platform.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {properties.map(property => (
                                            <div key={property.id} className={`bg-dark-card rounded-lg border overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group ${property.reportCount > 0 ? 'border-red-500/30' : 'border-dark-border'}`}>
                                                <div className="h-48 relative overflow-hidden bg-[#111] shrink-0">
                                                    {property.images && property.images.length > 0 ? (
                                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs tracking-widest bg-dark font-light">[NO IMAGE]</div>
                                                    )}
                                                    {property.reportCount > 0 && (
                                                        <span className="absolute top-4 right-4 bg-red-500/90 text-dark px-3 py-1 rounded-sm text-[10px] uppercase font-bold tracking-widest">
                                                            FLAGGED: {property.reportCount}
                                                        </span>
                                                    )}
                                                    <button 
                                                        onClick={() => handleToggleFeatured(property.id, property.promoted)}
                                                        className={`absolute top-4 left-4 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${property.promoted ? 'bg-brand/90 text-dark border border-brand' : 'bg-dark/60 text-gray-400 border border-gray-600/40 hover:text-brand'}`}
                                                        title={property.promoted ? "Unfeature Property" : "Feature Property"}
                                                    >
                                                        <svg className="w-4 h-4" fill={property.promoted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.25.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 12.11c-.773-.56-.375-1.81.587-1.81h4.907a1 1 0 00.95-.69l1.52-4.674z" /></svg>
                                                    </button>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-lg font-serif text-white font-medium group-hover:text-brand transition-colors line-clamp-1">{property.title}</h3>
                                                            <span className="text-brand text-sm font-bold font-mono">₹{property.price?.toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 font-mono mb-4">Status: <span className="text-gray-300 font-bold uppercase">{property.status}</span></p>
                                                        <p className="text-sm text-gray-400 font-light line-clamp-3 leading-relaxed mb-6">{property.description}</p>
                                                    </div>
                                                    <div className="flex gap-4 border-t border-dark-border pt-4">
                                                        <button
                                                            onClick={() => handleToggleFeatured(property.id, property.promoted)}
                                                            className={`flex-1 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all border ${property.promoted ? 'bg-brand text-dark hover:bg-brand-600 border-brand' : 'bg-transparent text-gray-300 border-dark-border hover:border-gray-500'}`}
                                                        >
                                                            {property.promoted ? 'Featured' : 'Promote'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProperty(property.id)}
                                                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 py-2.5 rounded-sm text-[10px] font-bold tracking-widest uppercase transition-all"
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

                        {/* TAB CONTENT: MAINTENANCE JOBS */}
                        {activeTab === 'maintenance' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-serif text-white">Global Maintenance Operations</h2>
                                {maintenanceAnalytics && (
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <div className="bg-dark/40 border border-dark-border rounded-lg p-4 text-center">
                                            <div className="text-2xl font-serif text-brand">{maintenanceAnalytics.totalTickets}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Total Tickets</div>
                                        </div>
                                        <div className="bg-dark/40 border border-dark-border rounded-lg p-4 text-center">
                                            <div className="text-2xl font-serif text-gray-300">{maintenanceAnalytics.openTickets}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Open Requests</div>
                                        </div>
                                        <div className="bg-dark/40 border border-dark-border rounded-lg p-4 text-center">
                                            <div className="text-2xl font-serif text-orange-400">{maintenanceAnalytics.assignedTickets}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">In Work Queue</div>
                                        </div>
                                        <div className="bg-dark/40 border border-dark-border rounded-lg p-4 text-center">
                                            <div className="text-2xl font-serif text-green-400">{maintenanceAnalytics.completedTickets}</div>
                                            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Completed</div>
                                        </div>
                                    </div>
                                )}
                                {tickets.length === 0 ? (
                                    <div className="bg-dark-card p-12 text-center rounded-xl border border-dark-border">
                                        <p className="text-gray-400">No maintenance tickets have been submitted.</p>
                                    </div>
                                ) : (
                                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-dark/80 border-b border-dark-border text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                        <th className="p-4">Issue Details</th>
                                                        <th className="p-4">Staff Assignee</th>
                                                        <th className="p-4">Severity</th>
                                                        <th className="p-4">Status</th>
                                                        <th className="p-4">Date Created</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-dark-border text-sm">
                                                    {tickets.map(ticket => (
                                                        <tr key={ticket.id} className="hover:bg-dark/40 transition-colors">
                                                            <td className="p-4 text-gray-200">
                                                                <div className="font-semibold text-white">{ticket.title}</div>
                                                                <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{ticket.description}</div>
                                                                <div className="text-[10px] text-brand/60 font-mono mt-1">Property: {ticket.propertyTitle || ticket.propertyId}</div>
                                                            </td>
                                                            <td className="p-4 text-gray-300">
                                                                {ticket.staffName ? (
                                                                    <div>
                                                                        <span className="font-medium text-white block">{ticket.staffName}</span>
                                                                        <span className="text-[10px] text-gray-500 font-mono">{ticket.staffEmail}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500 italic text-xs">Unassigned</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${ticket.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                    ticket.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                                        'bg-green-500/10 text-green-400 border border-green-500/20'
                                                                    }`}>
                                                                    {ticket.severity}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${ticket.status === 'COMPLETED' || ticket.status === 'CLOSED' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-brand/10 text-brand border-brand/30'}`}>
                                                                    {ticket.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-gray-500 text-xs font-mono">
                                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: USERS & STAFF MANAGEMENT */}
                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex justify-between items-center border-b border-dark-border pb-4">
                                    <div>
                                        <h2 className="text-2xl font-serif text-white">Users & Operations Staff</h2>
                                        <p className="text-xs text-gray-500 mt-1">Review accounts, ban/unban users, and update technical worker skills</p>
                                    </div>
                                    <button
                                        onClick={() => setShowStaffForm(!showStaffForm)}
                                        className="bg-brand hover:bg-brand-600 text-dark px-6 py-2.5 rounded-sm text-xs uppercase tracking-widest font-bold transition-all shadow-md"
                                    >
                                        {showStaffForm ? 'Cancel Registration' : '+ Register Maintenance Staff'}
                                    </button>
                                </div>

                                {showStaffForm && (
                                    <div className="bg-dark/40 backdrop-blur-md border border-brand/30 rounded-lg p-6 shadow-2xl animate-fade-in space-y-6">
                                        <h3 className="text-lg font-serif text-brand">Register New Operations Staff</h3>
                                        <form onSubmit={handleRegisterStaff} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Worker Name</label>
                                                    <input required type="text" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand text-sm" placeholder="Full Name" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Email Address</label>
                                                    <input required type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand text-sm" placeholder="email@rems.com" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Staff Password</label>
                                                    <input required type="text" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand text-sm" placeholder="Enter secure password" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Primary Technical Skills (Required for automatic task assignment)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {MAINTENANCE_SKILLS.map(skill => (
                                                        <button
                                                            key={skill}
                                                            type="button"
                                                            onClick={() => handleSkillToggle(skill)}
                                                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold tracking-wider uppercase transition-all border ${staffForm.skills.includes(skill) ? 'bg-brand text-dark border-brand' : 'bg-[#111] text-gray-400 border-dark-border hover:border-gray-500'}`}
                                                        >
                                                            {skill}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <button type="submit" disabled={formLoading || staffForm.skills.length === 0} className="bg-brand hover:bg-brand-600 text-dark px-8 py-3 rounded-sm font-bold tracking-widest uppercase text-xs transition-all disabled:opacity-50 shadow-md">
                                                    {formLoading ? 'Registering Worker...' : 'Register Worker'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-dark/80 border-b border-dark-border text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                    <th className="p-4">User</th>
                                                    <th className="p-4">Email</th>
                                                    <th className="p-4">Roles</th>
                                                    <th className="p-4">Maintenance Skills</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-dark-border text-sm">
                                                {usersList.map(u => {
                                                    const isStaff = u.roles && u.roles.some(role => role.includes('MAINTENANCE'));
                                                    return (
                                                        <tr key={u.id} className="hover:bg-dark/40 transition-colors">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-sm bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-serif text-sm uppercase">
                                                                        {u.name ? u.name.charAt(0) : 'U'}
                                                                    </div>
                                                                    <span className="text-white font-medium">{u.name || 'Unnamed User'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-gray-400 font-mono text-xs">{u.email}</td>
                                                            <td className="p-4">
                                                                <div className="flex gap-1.5 flex-wrap">
                                                                    {u.roles && u.roles.map(role => (
                                                                        <span key={role} className={`px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-widest font-bold border ${role === 'ROLE_ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' : role === 'ROLE_MAINTENANCE' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-brand/10 text-brand border-brand/20'}`}>
                                                                            {role.replace('ROLE_', '')}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {isStaff ? (
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {u.skills && u.skills.length > 0 ? (
                                                                            u.skills.map(s => (
                                                                                <span key={s} className="bg-brand/10 text-brand border border-brand/20 rounded px-1.5 py-0.5 text-[9px] uppercase font-semibold font-mono">
                                                                                    {s}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-gray-500 text-xs italic">No skills assigned</span>
                                                                        )}
                                                                        <button 
                                                                            onClick={() => openSkillsEditor(u)}
                                                                            className="text-[10px] text-brand hover:underline font-bold uppercase ml-1 flex items-center gap-0.5"
                                                                        >
                                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                            Edit
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-600 text-xs">-</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                {u.id !== user?.id ? (
                                                                    <button
                                                                        onClick={() => handleToggleBan(u.id, u.banned)}
                                                                        className={`px-3 py-1.5 rounded-sm text-[10px] uppercase font-bold tracking-widest transition-colors border ${u.banned
                                                                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600'
                                                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                                                            }`}
                                                                    >
                                                                        {u.banned ? 'Unban' : 'Ban Account'}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-brand/50 text-[10px] uppercase tracking-widest font-bold border border-brand/20 px-3 py-1.5 rounded-sm">Current Admin</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
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
                            </div>
                        )}

                        {/* TAB CONTENT: COMPLETED TRANSACTIONS */}
                        {activeTab === 'transactions' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-serif text-white">Sales & Rental Transactions Directory</h2>
                                    <p className="text-xs text-gray-500 mt-1">Review all finalized property transactions on the platform</p>
                                </div>
                                {properties.length === 0 ? (
                                    <div className="bg-dark-card p-12 text-center rounded-xl border border-dark-border">
                                        <p className="text-gray-400">No completed sales or rentals recorded.</p>
                                    </div>
                                ) : (
                                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-dark/80 border-b border-dark-border text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                        <th className="p-4">Property details</th>
                                                        <th className="p-4">Transaction Type</th>
                                                        <th className="p-4">Client Details</th>
                                                        <th className="p-4">Final Value</th>
                                                        <th className="p-4">Transaction Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-dark-border text-sm">
                                                    {properties.map(prop => (
                                                        <tr key={prop.id} className="hover:bg-dark/40 transition-colors">
                                                            <td className="p-4 text-gray-200">
                                                                <div className="font-semibold text-white">{prop.title}</div>
                                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{prop.city}, {prop.state}</div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${prop.status === 'SOLD' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                                    {prop.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-gray-300 text-sm">
                                                                <div className="font-medium text-white">{prop.transactionName || prop.saleBuyerDetails || 'N/A'}</div>
                                                                <div className="text-xs text-gray-500 font-mono mt-0.5">{prop.transactionContact || 'N/A'}</div>
                                                            </td>
                                                            <td className="p-4 text-brand font-bold font-mono">
                                                                ₹{prop.transactionAmount ? prop.transactionAmount.toLocaleString() : (prop.price ? prop.price.toLocaleString() : 'N/A')}
                                                            </td>
                                                            <td className="p-4 text-gray-400 text-xs font-mono">
                                                                {prop.soldDate ? new Date(prop.soldDate).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: FULL SECURITY INCIDENT LOGS */}
                        {activeTab === 'fraud' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <h2 className="text-2xl font-serif text-white">Platform Suspicious Logs</h2>
                                    <p className="text-xs text-gray-500 mt-1">Review automatically flagged suspicious requests or potential double-contract submissions</p>
                                </div>
                                {suspiciousLogs.length === 0 ? (
                                    <div className="bg-dark-card p-12 text-center rounded-xl border border-dark-border">
                                        <p className="text-gray-400">No suspicious activities detected.</p>
                                    </div>
                                ) : (
                                    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-dark/80 border-b border-dark-border text-gray-400 text-xs font-bold uppercase tracking-widest">
                                                        <th className="p-4">Date & Time</th>
                                                        <th className="p-4">Property Reference ID</th>
                                                        <th className="p-4">Offender User ID</th>
                                                        <th className="p-4">Fraud Trigger Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-dark-border text-sm">
                                                    {suspiciousLogs.map(log => (
                                                        <tr key={log.id} className="hover:bg-dark/40 transition-colors">
                                                            <td className="p-4 text-gray-500 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                                            <td className="p-4 text-brand font-mono text-xs">{log.propertyId}</td>
                                                            <td className="p-4 text-brand font-mono text-xs">{log.userId}</td>
                                                            <td className="p-4 text-gray-200 leading-relaxed font-light">{log.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL: STAFF TECHNICAL SKILL ASSIGNMENT */}
            {editingStaff && (
                <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-dark-card border border-brand/30 w-full max-w-lg rounded-lg shadow-2xl p-6 space-y-6 animate-scale-up">
                        <div className="border-b border-dark-border pb-3 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-serif text-white">Manage Technical Skills</h3>
                                <p className="text-xs text-gray-500 mt-1">Assign task categories for: {editingStaff.name}</p>
                            </div>
                            <button 
                                onClick={() => setEditingStaff(null)} 
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">Toggle Available Skill Sets</label>
                            <div className="grid grid-cols-2 gap-3">
                                {MAINTENANCE_SKILLS.map(skill => {
                                    const isSelected = tempSkills.includes(skill);
                                    return (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => handleTempSkillToggle(skill)}
                                            className={`p-3 rounded border text-xs font-bold uppercase tracking-wider text-left transition-all ${isSelected ? 'bg-brand/10 text-brand border-brand' : 'bg-dark/40 text-gray-500 border-dark-border hover:border-gray-600'}`}
                                        >
                                            {skill}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t border-dark-border pt-4 flex gap-4 justify-end">
                            <button
                                onClick={() => setEditingStaff(null)}
                                className="px-5 py-2.5 rounded-sm border border-dark-border text-gray-400 text-xs uppercase tracking-widest font-bold hover:bg-dark/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSkills}
                                disabled={isSavingSkills || tempSkills.length === 0}
                                className="bg-brand hover:bg-brand-600 text-dark px-6 py-2.5 rounded-sm text-xs uppercase tracking-widest font-bold transition-all shadow-md disabled:opacity-50"
                            >
                                {isSavingSkills ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
