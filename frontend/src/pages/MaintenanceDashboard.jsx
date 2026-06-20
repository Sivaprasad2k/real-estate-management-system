import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MaintenanceDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [availableTickets, setAvailableTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('active'); // active, available, completed
    const [error, setError] = useState(null);

    // Operational enhancements states
    const [metrics, setMetrics] = useState({
        totalCompleted: 0,
        averageResolutionTimeHours: 0,
        activeJobs: 0,
        reopenedTicketsCount: 0,
        completionRate: 0
    });

    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [resolutionSummary, setResolutionSummary] = useState('');
    const [beforePhotos, setBeforePhotos] = useState([]);
    const [afterPhotos, setAfterPhotos] = useState([]);
    const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

    // Search and filters for history
    const [historySearch, setHistorySearch] = useState('');
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const [myRes, availRes, metricsRes, profileRes] = await Promise.all([
                api.get('/maintenance/staff'),
                api.get('/maintenance/available'),
                api.get('/maintenance/staff/metrics'),
                api.get('/users/me')
            ]);
            setTickets(myRes.data);
            setAvailableTickets(availRes.data);
            setMetrics(metricsRes.data);
            setProfile(profileRes.data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
            setError("Could not load your maintenance queue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            await api.put(`/maintenance/${ticketId}/status?status=${newStatus}`);
            fetchTickets();
        } catch (err) {
            alert(err.response?.data || "Failed to update ticket status");
        }
    };

    const handleAcceptTicket = async (ticketId) => {
        try {
            await api.put(`/maintenance/${ticketId}/accept`);
            fetchTickets();
            alert("Job claimed successfully!");
        } catch (err) {
            alert(err.response?.data || "Failed to accept ticket");
        }
    };

    const handleCancelTicket = async (ticketId) => {
        try {
            await api.put(`/maintenance/${ticketId}/cancel`);
            fetchTickets();
            alert("Job released successfully.");
        } catch (err) {
            alert(err.response?.data || "Failed to release ticket");
        }
    };

    const handlePhotoUpload = (e, target) => {
        const files = Array.from(e.target.files);
        const promises = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        });

        Promise.all(promises).then(base64Images => {
            if (target === 'before') {
                setBeforePhotos(prev => [...prev, ...base64Images]);
            } else {
                setAfterPhotos(prev => [...prev, ...base64Images]);
            }
        }).catch(err => {
            console.error("Failed to read files", err);
            alert("Error loading images. Please try again.");
        });
    };

    const removePhoto = (index, target) => {
        if (target === 'before') {
            setBeforePhotos(prev => prev.filter((_, idx) => idx !== index));
        } else {
            setAfterPhotos(prev => prev.filter((_, idx) => idx !== index));
        }
    };

    const openCompletionModal = (ticket) => {
        setSelectedTicket(ticket);
        setResolutionSummary('');
        setBeforePhotos([]);
        setAfterPhotos([]);
        setShowCompletionModal(true);
    };

    const handleSubmitCompletion = async (e) => {
        e.preventDefault();
        if (!resolutionSummary.trim()) {
            alert("Resolution summary is required.");
            return;
        }
        if (beforePhotos.length === 0) {
            alert("At least one 'Before Repair' photo is required.");
            return;
        }
        if (afterPhotos.length === 0) {
            alert("At least one 'After Repair' photo is required.");
            return;
        }

        setIsSubmittingCompletion(true);
        try {
            await api.put(`/maintenance/${selectedTicket.id}/complete`, {
                resolutionSummary,
                beforeRepairPhotos: beforePhotos,
                afterRepairPhotos: afterPhotos
            });
            setShowCompletionModal(false);
            setResolutionSummary('');
            setBeforePhotos([]);
            setAfterPhotos([]);
            setSelectedTicket(null);
            fetchTickets();
            alert("Maintenance job completed successfully!");
        } catch (err) {
            alert(err.response?.data || "Failed to complete ticket");
        } finally {
            setIsSubmittingCompletion(false);
        }
    };

    const activeAssignedTickets = tickets.filter(t => t.status === 'ASSIGNED' || t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS');
    const completedTickets = tickets.filter(t => t.status === 'COMPLETED' || t.status === 'CLOSED');

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
            {/* Header section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-dark-card via-dark-card/90 to-dark/50 border border-dark-border/80 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
                {/* Glow decorations */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-brand animate-pulse"></span>
                            <span className="text-brand text-[10px] uppercase tracking-widest font-extrabold">Operator Portal</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-serif text-white tracking-wide">Maintenance Workspace</h1>
                        <div className="flex gap-3 items-center flex-wrap pt-1">
                            <div className="flex items-center gap-2 bg-[#141414] border border-dark-border/85 rounded-lg px-3 py-1.5 shadow-inner">
                                <svg className="w-4 h-4 text-brand/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-gray-300 text-xs font-semibold">{user?.name || 'Staff User'}</span>
                            </div>
                            <span className="text-gray-700 text-sm hidden sm:inline">•</span>
                            <div className="flex gap-1.5 flex-wrap items-center">
                                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mr-1">Skills:</span>
                                {profile?.skills && profile.skills.length > 0 ? (
                                    profile.skills.map(s => (
                                        <span key={s} className="bg-brand/10 text-brand border border-brand/20 rounded px-2.5 py-0.5 text-[9px] uppercase font-extrabold tracking-wider font-mono hover:bg-brand/20 transition-all duration-300 shadow-sm">
                                            {s}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-red-400/80 text-xs italic bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">No skills registered</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-brand/5 border border-brand/20 rounded-xl px-4 py-2.5 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-brand font-bold uppercase tracking-widest font-mono">Status: Connected</span>
                    </div>
                </div>
            </div>

            {/* Phase 1 Warning Banner */}
            {!isLoading && profile && (!profile.skills || profile.skills.length === 0) && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-amber-400 px-6 py-5 rounded-2xl backdrop-blur-md text-sm shadow-xl flex items-center gap-4 animate-pulse">
                    <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30 shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-base text-white font-serif tracking-wide">Skills Assignment Required</h4>
                        <p className="text-xs text-gray-400 mt-0.5">No maintenance skills are assigned to your profile yet. Please contact the administrator to register your skill sets so you can start claiming jobs.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl backdrop-blur-md text-sm shadow-lg flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Staff Performance Metrics & Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Active Jobs */}
                <div className="relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-card/90 border border-dark-border/80 rounded-2xl p-5 hover:border-brand/40 transition-all duration-300 group shadow-lg">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-yellow-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-yellow-500/10 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Active Jobs</p>
                            <p className="text-3xl font-serif text-yellow-500 font-bold group-hover:scale-105 transition-transform origin-left duration-300">{metrics.activeJobs}</p>
                        </div>
                        <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/20 group-hover:border-yellow-500/40 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Total Completed */}
                <div className="relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-card/90 border border-dark-border/80 rounded-2xl p-5 hover:border-brand/40 transition-all duration-300 group shadow-lg">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-green-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-green-500/10 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Completed</p>
                            <p className="text-3xl font-serif text-green-400 font-bold group-hover:scale-105 transition-transform origin-left duration-300">{metrics.totalCompleted}</p>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-xl text-green-400 border border-green-500/20 group-hover:border-green-500/40 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Avg Resolution Time */}
                <div className="relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-card/90 border border-dark-border/80 rounded-2xl p-5 hover:border-brand/40 transition-all duration-300 group shadow-lg">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-brand/5 rounded-full blur-xl pointer-events-none group-hover:bg-brand/10 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Avg Resolution</p>
                            <p className="text-2xl font-serif text-brand font-bold mt-1 group-hover:scale-105 transition-transform origin-left duration-300">{metrics.averageResolutionTimeHours.toFixed(1)} hrs</p>
                        </div>
                        <div className="p-2 bg-brand/10 rounded-xl text-brand border border-brand/20 group-hover:border-brand/40 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Reopened Count */}
                <div className="relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-card/90 border border-dark-border/80 rounded-2xl p-5 hover:border-brand/40 transition-all duration-300 group shadow-lg">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/10 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Reopened</p>
                            <p className="text-3xl font-serif text-red-400 font-bold group-hover:scale-105 transition-transform origin-left duration-300">{metrics.reopenedTicketsCount}</p>
                        </div>
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20 group-hover:border-red-500/40 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" /></svg>
                        </div>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="relative overflow-hidden bg-gradient-to-br from-dark-card to-dark-card/90 border border-dark-border/80 rounded-2xl p-5 hover:border-brand/40 transition-all duration-300 group shadow-lg col-span-2 lg:col-span-1">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-all"></div>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Success Rate</p>
                            <p className="text-3xl font-serif text-blue-400 font-bold group-hover:scale-105 transition-transform origin-left duration-300">{metrics.completionRate.toFixed(0)}%</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 group-hover:border-blue-500/40 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="flex border-b border-dark-border/80 gap-2 relative overflow-x-auto whitespace-nowrap hidden-scroll">
                <button
                    onClick={() => setActiveSection('active')}
                    className={`relative px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
                        activeSection === 'active' ? 'text-brand' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    My Active Worklist
                    <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2.5 py-0.5 rounded-full border border-yellow-500/20 font-mono font-bold">
                        {activeAssignedTickets.length}
                    </span>
                    {activeSection === 'active' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand shadow-[0_-2px_10px_rgba(212,175,55,0.4)] rounded-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveSection('available')}
                    className={`relative px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
                        activeSection === 'available' ? 'text-brand' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Available Jobs Pool
                    <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono font-bold">
                        {availableTickets.length}
                    </span>
                    {activeSection === 'available' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand shadow-[0_-2px_10px_rgba(212,175,55,0.4)] rounded-full"></span>
                    )}
                </button>
                <button
                    onClick={() => setActiveSection('completed')}
                    className={`relative px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
                        activeSection === 'completed' ? 'text-brand' : 'text-gray-400 hover:text-white'
                    }`}
                >
                    Resolved History
                    <span className="bg-green-500/10 text-green-400 text-[10px] px-2.5 py-0.5 rounded-full border border-green-500/20 font-mono font-bold">
                        {completedTickets.length}
                    </span>
                    {activeSection === 'completed' && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand shadow-[0_-2px_10px_rgba(212,175,55,0.4)] rounded-full"></span>
                    )}
                </button>
            </div>

            {/* WORKSPACE SECTIONS */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
                </div>
            ) : (
                <div className="bg-gradient-to-b from-dark-card to-dark-card/95 border border-dark-border/80 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[450px] backdrop-blur-sm relative overflow-hidden">
                                        {/* SECTION 1: ACTIVE ASSIGNED TICKETS WORKLIST CARD LAYOUT */}
                    {activeSection === 'active' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-serif text-white">My Active Worklist</h2>
                                <p className="text-xs text-gray-500 mt-1">These tickets are assigned to you. Start work or mark completion as you perform duties.</p>
                            </div>
                            {activeAssignedTickets.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 italic text-sm">
                                    No active maintenance tasks in your worklist. Select "Available Jobs Pool" to claim tasks.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {activeAssignedTickets.map(ticket => (
                                        <div key={ticket.id} className="bg-gradient-to-r from-dark/60 via-dark/40 to-dark/20 border border-dark-border/80 border-t-2 border-t-brand/30 rounded-2xl p-6 hover:border-brand/40 hover:border-t-brand hover:shadow-2xl hover:shadow-brand/5 hover:translate-y-[-2px] transition-all duration-300 flex flex-col lg:flex-row justify-between gap-6 relative overflow-hidden">
                                            {/* Subtle background glow decoration */}
                                            <div className="absolute top-0 left-0 w-24 h-24 bg-brand/5 rounded-full blur-2xl pointer-events-none"></div>

                                            {/* Details column */}
                                            <div className="space-y-4 flex-1 relative z-10">
                                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${
                                                            ticket.priority === 'EMERGENCY' ? 'bg-red-600/20 text-red-400 border-red-500/40 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.25)]' :
                                                            ticket.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            ticket.priority === 'LOW' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            'bg-orange-500/10 text-orange-400 border-orange-500/20' // MEDIUM
                                                        }`}>
                                                            {ticket.priority || 'MEDIUM'}
                                                        </span>
                                                        <span className="bg-brand/10 text-brand border border-brand/20 px-2.5 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                                                            {ticket.type || 'GENERAL'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono">Ticket ID: {ticket.id}</span>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                                                        ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-inner' :
                                                        ticket.status === 'ACCEPTED' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-inner' :
                                                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-inner' // ASSIGNED
                                                    }`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-serif text-white font-medium group-hover:text-brand transition-colors">{ticket.title}</h3>
                                                    <p className="text-xs text-gray-400 mt-2 whitespace-pre-wrap leading-relaxed bg-[#0e0e0e]/50 border border-dark-border/40 p-4 rounded-xl">{ticket.description}</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-dark-border/40 pt-4 text-xs">
                                                    <div className="space-y-1">
                                                        <p className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">Property Location</p>
                                                        <p className="text-white font-semibold flex items-center gap-1.5 mt-1">
                                                            <svg className="w-3.5 h-3.5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" /></svg>
                                                            {ticket.propertyTitle}
                                                        </p>
                                                        <p className="text-gray-400 font-mono text-[10px] pl-5">{ticket.propertyAddress}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">Contacts</p>
                                                        <p className="text-gray-200 mt-1 flex items-center gap-1.5"><span className="text-gray-500 text-[10px] uppercase w-12 shrink-0">Owner:</span> <span className="font-semibold">{ticket.ownerName || 'N/A'}</span></p>
                                                        <p className="text-gray-200 flex items-center gap-1.5"><span className="text-gray-500 text-[10px] uppercase w-12 shrink-0">Tenant:</span> <span className="font-semibold">{ticket.tenantName || 'N/A'}</span></p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">Timeline & SLA</p>
                                                        <p className="text-gray-300 mt-1"><span className="text-gray-500">Assigned:</span> <span className="font-mono text-[10px]">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}</span></p>
                                                        <p className="text-gray-300">
                                                            <span className="text-gray-500">SLA Limit:</span>{' '}
                                                            <span className={`font-mono text-[10px] font-bold ${ticket.slaDeadline && new Date(ticket.slaDeadline) < new Date() ? 'text-red-400 animate-pulse' : 'text-brand'}`}>
                                                                {ticket.slaDeadline ? new Date(ticket.slaDeadline).toLocaleString() : 'N/A'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Timeline Trail */}
                                                {ticket.timeline && ticket.timeline.length > 0 && (
                                                    <div className="border-t border-dark-border/40 pt-4 mt-2">
                                                        <p className="text-gray-500 uppercase tracking-wider text-[9px] font-bold mb-2 flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Audit Timeline Trail
                                                        </p>
                                                        <div className="flex flex-col gap-2 font-mono text-[10px] bg-[#0c0c0c]/80 border border-dark-border/30 rounded-xl p-3">
                                                            {ticket.timeline.map((entry, idx) => (
                                                                <div key={idx} className="flex gap-2 items-start text-gray-400">
                                                                    <span className="text-brand font-bold">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                                                                    <span className="text-white font-bold">{entry.status}:</span>
                                                                    <span>{entry.description}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons column */}
                                            <div className="flex flex-col justify-center items-stretch lg:border-l lg:border-dark-border/60 lg:pl-6 min-w-[160px] gap-3 relative z-10">
                                                {ticket.status === 'ASSIGNED' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(ticket.id, 'ACCEPTED')}
                                                            className="bg-brand hover:bg-brand-600 text-dark font-extrabold py-2.5 px-4 rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-md text-center hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                                        >
                                                            Accept Job
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelTicket(ticket.id)}
                                                            className="bg-transparent hover:bg-red-500/10 border border-red-500/40 text-red-400 font-bold py-2.5 px-4 rounded-xl text-[10px] tracking-widest uppercase transition-all text-center"
                                                        >
                                                            Release Job
                                                        </button>
                                                    </>
                                                )}
                                                {ticket.status === 'ACCEPTED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                                                        className="bg-brand hover:bg-brand-600 text-dark font-extrabold py-2.5 px-4 rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-md text-center hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                                    >
                                                        Start Work
                                                    </button>
                                                )}
                                                {ticket.status === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => openCompletionModal(ticket)}
                                                        className="bg-green-500 hover:bg-green-600 text-dark font-extrabold py-2.5 px-4 rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-md text-center hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                                                    >
                                                        Mark Completed
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* SECTION 2: AVAILABLE JOBS POOL */}
                    {activeSection === 'available' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-serif text-white">Available Jobs Pool</h2>
                                <p className="text-xs text-gray-500 mt-1">These requests match your registered skill sets and are unassigned. Claim them to start working.</p>
                            </div>
                            {availableTickets.length === 0 ? (
                                <div className="text-center py-20 text-gray-500 italic text-sm">
                                    No available jobs match your skill profile at this time.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availableTickets.map(ticket => (
                                        <div key={ticket.id} className="bg-gradient-to-b from-dark/50 to-dark/30 border border-dark-border/80 border-t-2 border-t-brand/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-brand/40 hover:border-t-brand hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300 relative overflow-hidden">
                                            {/* Subtle background glow */}
                                            <div className="absolute top-0 left-0 w-16 h-16 bg-brand/5 rounded-full blur-xl pointer-events-none"></div>

                                            <div className="space-y-3 relative z-10">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <span className="bg-brand/10 text-brand border border-brand/20 px-2.5 py-0.5 rounded text-[9px] uppercase font-bold font-mono">
                                                            {ticket.type || 'GENERAL'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono block">ID: {ticket.id}</span>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded text-[8px] font-bold border uppercase tracking-wider ${
                                                        ticket.priority === 'EMERGENCY' ? 'bg-red-600/20 text-red-400 border-red-500/40 animate-pulse' :
                                                        ticket.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        ticket.priority === 'LOW' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                        'bg-orange-500/10 text-orange-400 border-orange-500/20' // MEDIUM
                                                    }`}>
                                                        {ticket.priority || 'MEDIUM'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-medium font-serif text-base line-clamp-1">{ticket.title}</h3>
                                                    <p className="text-xs text-gray-400 line-clamp-3 mt-1.5 leading-relaxed bg-[#0c0c0c]/45 border border-dark-border/30 p-3 rounded-lg">{ticket.description}</p>
                                                </div>
                                                <div className="border-t border-dark-border/60 pt-3 space-y-2">
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Property:</span>
                                                        <span className="text-gray-300 font-semibold truncate w-36 text-right">{ticket.propertyTitle || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Address:</span>
                                                        <span className="text-gray-300 font-medium truncate w-36 text-right" title={ticket.propertyAddress}>{ticket.propertyAddress || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Date Posted:</span>
                                                        <span className="text-gray-400 font-mono">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-gray-500">Required Skill:</span>
                                                        <span className="text-brand font-bold uppercase font-mono">{ticket.type || 'GENERAL'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAcceptTicket(ticket.id)}
                                                className="w-full bg-brand hover:bg-brand-600 text-dark font-extrabold py-2.5 rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-md relative z-10 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                            >
                                                Claim Job
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* SECTION 3: COMPLETED RESOLVED TICKETS HISTORY */}
                    {activeSection === 'completed' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-dark-border pb-4">
                                <div>
                                    <h2 className="text-xl font-serif text-white">Resolved Tasks History</h2>
                                    <p className="text-xs text-gray-500 mt-1">Review your completed maintenance request tickets.</p>
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <div className="relative w-full md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search completed jobs..."
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            className="bg-[#121212]/80 border border-dark-border/80 rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/35 transition-all w-full"
                                        />
                                        <svg className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket list filtered */}
                            {completedTickets.filter(ticket => {
                                return (
                                    ticket.title?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                    ticket.id?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                    ticket.propertyTitle?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                    ticket.resolutionSummary?.toLowerCase().includes(historySearch.toLowerCase())
                                );
                            }).length === 0 ? (
                                <div className="text-center py-20 text-gray-500 italic text-sm">
                                    No completed tickets recorded matching the search.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {completedTickets
                                        .filter(ticket => {
                                            return (
                                                ticket.title?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                                ticket.id?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                                ticket.propertyTitle?.toLowerCase().includes(historySearch.toLowerCase()) ||
                                                ticket.resolutionSummary?.toLowerCase().includes(historySearch.toLowerCase())
                                            );
                                        })
                                        .map(ticket => {
                                            const timeTaken = () => {
                                                if (!ticket.completedAt || !ticket.acceptedAt) return "N/A";
                                                const diffMs = new Date(ticket.completedAt) - new Date(ticket.acceptedAt);
                                                const diffHrs = diffMs / (1000 * 60 * 60);
                                                if (diffHrs < 1) {
                                                    return `${Math.round(diffHrs * 60)} mins`;
                                                }
                                                return `${diffHrs.toFixed(1)} hrs`;
                                            };

                                            return (
                                                <div key={ticket.id} className="bg-gradient-to-r from-dark/50 via-dark/40 to-dark/30 border border-dark-border/80 border-t-2 border-t-green-500/30 rounded-2xl p-6 hover:border-green-500/40 hover:border-t-green-500 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                                                    {/* Subtle background glow */}
                                                    <div className="absolute top-0 left-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>

                                                    <div className="flex justify-between items-start gap-4 flex-wrap pb-3 border-b border-dark-border/40 relative z-10">
                                                        <div className="space-y-1">
                                                            <div className="flex gap-2 items-center">
                                                                <h3 className="text-base font-serif text-white font-semibold">{ticket.propertyTitle}</h3>
                                                                <span className="text-xs text-gray-500 font-mono">#{ticket.id}</span>
                                                            </div>
                                                            <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 rounded px-2.5 py-0.5 uppercase font-bold font-mono">
                                                                {ticket.type}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                                {ticket.status}
                                                            </span>
                                                            <p className="text-[10px] text-gray-500 mt-1 font-mono">Completed: {ticket.completedAt ? new Date(ticket.completedAt).toLocaleDateString() : 'N/A'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 space-y-4 relative z-10">
                                                        <div>
                                                            <p className="text-gray-300 font-serif font-medium text-base">{ticket.title}</p>
                                                            <p className="text-xs text-gray-400 mt-1 leading-relaxed bg-[#0c0c0c]/40 border border-dark-border/30 p-3 rounded-lg">{ticket.description}</p>
                                                        </div>

                                                        {/* Phase 5: Resolution Summary */}
                                                        {ticket.resolutionSummary && (
                                                            <div className="bg-brand/5 border border-brand/10 rounded-xl p-4 shadow-inner">
                                                                <p className="text-brand uppercase tracking-wider text-[9px] font-bold mb-1">Resolution Summary</p>
                                                                <p className="text-xs text-gray-200 leading-relaxed font-sans">{ticket.resolutionSummary}</p>
                                                            </div>
                                                        )}

                                                        {/* Operational times */}
                                                        <div className="flex gap-6 text-xs text-gray-500 font-mono bg-[#0c0c0c]/30 rounded-lg px-3 py-1.5 w-max border border-dark-border/20">
                                                            <p><span className="text-gray-600">Completion Date:</span> {ticket.completedAt ? new Date(ticket.completedAt).toLocaleString() : 'N/A'}</p>
                                                            <p><span className="text-gray-600">Time Taken:</span> <span className="text-brand font-bold">{timeTaken()}</span></p>
                                                        </div>

                                                        {/* Phase 6 Photo Evidence views */}
                                                        {((ticket.beforeRepairPhotos && ticket.beforeRepairPhotos.length > 0) || 
                                                          (ticket.afterRepairPhotos && ticket.afterRepairPhotos.length > 0)) && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-dark-border/40 pt-4">
                                                                <div>
                                                                    <p className="text-gray-500 text-[9px] uppercase tracking-wider font-bold mb-2">Before Repair Evidence</p>
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {ticket.beforeRepairPhotos?.map((img, idx) => (
                                                                            <img key={idx} src={img} alt="Before" className="h-16 w-20 object-cover rounded-lg border border-dark-border hover:scale-105 transition-transform" />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 text-[9px] uppercase tracking-wider font-bold mb-2">After Repair Evidence</p>
                                                                    <div className="flex gap-2 flex-wrap">
                                                                        {ticket.afterRepairPhotos?.map((img, idx) => (
                                                                            <img key={idx} src={img} alt="After" className="h-16 w-20 object-cover rounded-lg border border-dark-border hover:scale-105 transition-transform" />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* COMPLETION MODAL */}
            {showCompletionModal && selectedTicket && (
                <div className="fixed inset-0 bg-[#070707]/90 backdrop-blur-md flex items-start md:items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
                    <div className="bg-gradient-to-b from-dark-card to-dark-card/95 border border-brand/20 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up">
                        {/* Glow ornament */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none"></div>

                        <button 
                            onClick={() => setShowCompletionModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                        <div>
                            <span className="text-[10px] bg-brand/10 text-brand border border-brand/20 rounded px-2.5 py-0.5 uppercase font-bold font-mono">
                                Ticket #{selectedTicket.id}
                            </span>
                            <h3 className="text-2xl font-serif text-white mt-2">Submit Job Completion Details</h3>
                            <p className="text-xs text-gray-500 mt-1">Please provide the resolution notes and photo evidence before marking the job as complete.</p>
                        </div>

                        <form onSubmit={handleSubmitCompletion} className="space-y-6">
                            {/* Resolution Summary */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Resolution Summary (Mandatory)</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Explain the resolution. e.g. Replaced damaged water valve and tested pipeline."
                                    value={resolutionSummary}
                                    onChange={(e) => setResolutionSummary(e.target.value)}
                                    className="w-full bg-[#121212]/80 border border-dark-border/80 rounded-xl p-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/35 transition-all resize-none"
                                />
                            </div>

                            {/* Before Repair Photos */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Before Repair Photos (Mandatory)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, 'before')}
                                    className="text-xs text-gray-500 file:bg-brand/10 file:text-brand file:border-brand/20 file:px-3 file:py-1.5 file:rounded-lg file:mr-3 file:hover:bg-brand/20 file:cursor-pointer"
                                />
                                <div className="flex gap-2 flex-wrap pt-2">
                                    {beforePhotos.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={img} alt="Before preview" className="h-16 w-20 object-cover rounded-lg border border-dark-border" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx, 'before')}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] hover:bg-red-600 shadow"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* After Repair Photos */}
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">After Repair Photos (Mandatory)</label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handlePhotoUpload(e, 'after')}
                                    className="text-xs text-gray-500 file:bg-brand/10 file:text-brand file:border-brand/20 file:px-3 file:py-1.5 file:rounded-lg file:mr-3 file:hover:bg-brand/20 file:cursor-pointer"
                                />
                                <div className="flex gap-2 flex-wrap pt-2">
                                    {afterPhotos.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={img} alt="After preview" className="h-16 w-20 object-cover rounded-lg border border-dark-border" />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx, 'after')}
                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] hover:bg-red-600 shadow"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40">
                                <button
                                    type="button"
                                    onClick={() => setShowCompletionModal(false)}
                                    className="bg-transparent border border-dark-border text-gray-400 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingCompletion}
                                    className="bg-green-500 hover:bg-green-600 text-dark px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                                >
                                    {isSubmittingCompletion ? 'Submitting...' : 'Submit Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaintenanceDashboard;
