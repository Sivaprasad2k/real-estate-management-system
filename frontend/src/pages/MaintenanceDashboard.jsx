import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const MaintenanceDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [availableTickets, setAvailableTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('AVAILABLE'); // AVAILABLE, OPEN, IN_PROGRESS, RESOLVED
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const [myRes, availRes] = await Promise.all([
                api.get('/maintenance/staff'),
                api.get('/maintenance/available')
            ]);
            setTickets(myRes.data);
            setAvailableTickets(availRes.data);
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
            const res = await api.put(`/maintenance/${ticketId}/status?status=${newStatus}`);
            setTickets(tickets.map(t => t.id === ticketId ? res.data : t));
        } catch (err) {
            alert(err.response?.data || "Failed to update ticket status");
        }
    };

    const handleAcceptTicket = async (ticketId) => {
        try {
            await api.put(`/maintenance/${ticketId}/accept`);
            fetchTickets();
        } catch (err) {
            alert(err.response?.data || "Failed to accept ticket");
        }
    };

    const handleCancelTicket = async (ticketId) => {
        try {
            await api.put(`/maintenance/${ticketId}/cancel`);
            fetchTickets();
        } catch (err) {
            alert(err.response?.data || "Failed to cancel ticket");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'ASSIGNED');
    const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS');
    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');

    const renderTicketCard = (ticket) => (
        <div key={ticket.id} className="bg-dark/40 backdrop-blur-md rounded-xl border border-dark-border p-6 shadow-lg hover:shadow-xl transition-all relative group flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className="bg-brand-400/20 text-brand-300 border border-brand-400/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                        {ticket.type || 'GENERAL'}
                    </span>
                    <h3 className="text-xl font-serif text-white mt-3 truncate" title={ticket.title}>{ticket.title}</h3>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400 block mb-1">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${ticket.status === 'OPEN' || ticket.status === 'ASSIGNED' ? 'bg-yellow-900/40 text-yellow-500' : ticket.status === 'IN_PROGRESS' ? 'bg-blue-900/40 text-blue-400' : 'bg-green-900/40 text-green-400'}`}>
                        {ticket.status}
                    </span>
                </div>
            </div>

            <p className="text-sm text-gray-400 mb-6 bg-[#111] p-3 rounded-md line-clamp-3 flex-grow">{ticket.description}</p>

            <div className="border-t border-dark-border pt-4 mt-auto">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1">Property</p>
                        <p className="text-sm text-gray-300 font-medium truncate w-48" title={ticket.propertyTitle}>{ticket.propertyTitle || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1">Requested By</p>
                        <p className="text-sm text-gray-300 font-medium">{ticket.tenantName || 'Tenant'}</p>
                        <a href={`mailto:${ticket.tenantEmail}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">{ticket.tenantEmail}</a>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    {ticket.status === 'OPEN' && !tickets.find(t => t.id === ticket.id) && (
                        <button
                            onClick={() => handleAcceptTicket(ticket.id)}
                            className="w-full bg-blue-500 text-white font-medium py-2 rounded shadow-sm hover:bg-blue-400 transition-colors tracking-wide text-sm"
                        >
                            Claim Job
                        </button>
                    )}
                    {tickets.find(t => t.id === ticket.id) && (ticket.status === 'OPEN' || ticket.status === 'ASSIGNED') && (
                        <div className="flex gap-2 w-full">
                            <button
                                onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                                className="flex-1 bg-brand-500 text-dark font-medium py-2 rounded shadow-sm hover:bg-brand-400 transition-colors tracking-wide text-sm"
                            >
                                Start Work
                            </button>
                            <button
                                onClick={() => handleCancelTicket(ticket.id)}
                                className="flex-1 bg-red-600/90 text-white font-medium py-2 rounded shadow-sm hover:bg-red-500 transition-colors tracking-wide text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    {tickets.find(t => t.id === ticket.id) && ticket.status === 'IN_PROGRESS' && (
                        <button
                            onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                            className="w-full bg-green-600/90 text-white font-medium py-2 rounded shadow-sm hover:bg-green-500 transition-colors tracking-wide text-sm"
                        >
                            Mark Resolved
                        </button>
                    )}
                    {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                        <button
                            disabled
                            className="w-full bg-gray-600/50 text-gray-400 font-medium py-2 rounded cursor-not-allowed tracking-wide text-sm"
                        >
                            Completed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-white tracking-wide">Staff Workspace</h1>
                    <p className="text-brand-400 text-md italic mt-2">Maintenance Operations</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500 tracking-widest uppercase font-bold">Operator</p>
                    <p className="text-gray-300 text-md font-medium">{user?.name || 'Staff'}</p>
                </div>
            </div>

            <main>
                {error && (
                    <div className="bg-red-900/30 border border-red-500/50 text-red-400 px-6 py-4 rounded-md mb-8 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                {/* Dashboard Stats */}
                <div className="grid grid-cols-4 gap-6 mb-12">
                    <div className="bg-dark/40 border border-dark-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-gray-500 text-[11px] uppercase tracking-widest font-bold mb-2 z-10">Available</p>
                        <p className="text-5xl font-serif text-blue-500 z-10">{availableTickets.length}</p>
                    </div>
                    <div className="bg-dark/40 border border-dark-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-yellow-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-gray-500 text-[11px] uppercase tracking-widest font-bold mb-2 z-10">My Queue</p>
                        <p className="text-5xl font-serif text-yellow-500 z-10">{openTickets.length}</p>
                    </div>
                    <div className="bg-dark/40 border border-brand-500/30 shadow-[0_0_15px_rgba(211,188,165,0.05)] rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-brand-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-brand-400 text-[11px] uppercase tracking-widest font-bold mb-2 z-10">In Progress</p>
                        <p className="text-5xl font-serif text-brand-300 z-10">{inProgressTickets.length}</p>
                    </div>
                    <div className="bg-dark/40 border border-dark-border rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-gray-500 text-[11px] uppercase tracking-widest font-bold mb-2 z-10">Resolved</p>
                        <p className="text-5xl font-serif text-green-500 z-10">{resolvedTickets.length}</p>
                    </div>
                </div>

                {/* Task Board */}
                <div className="bg-dark/20 rounded-2xl border border-dark-border overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-dark-border">
                        <button
                            onClick={() => setActiveTab('AVAILABLE')}
                            className={`flex-1 py-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${activeTab === 'AVAILABLE' ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-dark/50'}`}
                        >
                            Available Jobs <span className="ml-2 bg-blue-900/50 text-blue-500 px-2 rounded-full text-[10px]">{availableTickets.length}</span>
                            {activeTab === 'AVAILABLE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('OPEN')}
                            className={`flex-1 py-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${activeTab === 'OPEN' ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-dark/50'}`}
                        >
                            Open Requests <span className="ml-2 bg-yellow-900/50 text-yellow-500 px-2 rounded-full text-[10px]">{openTickets.length}</span>
                            {activeTab === 'OPEN' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('IN_PROGRESS')}
                            className={`flex-1 py-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${activeTab === 'IN_PROGRESS' ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300 hover:bg-dark/50'}`}
                        >
                            In Progress <span className="ml-2 bg-brand-900/50 text-brand-300 px-2 rounded-full text-[10px]">{inProgressTickets.length}</span>
                            {activeTab === 'IN_PROGRESS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-400"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('RESOLVED')}
                            className={`flex-1 py-4 text-sm font-medium tracking-wide uppercase transition-colors relative ${activeTab === 'RESOLVED' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300 hover:bg-dark/50'}`}
                        >
                            Resolved <span className="ml-2 bg-green-900/50 text-green-500 px-2 rounded-full text-[10px]">{resolvedTickets.length}</span>
                            {activeTab === 'RESOLVED' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500"></div>}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-8 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-400"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'AVAILABLE' && (
                                    availableTickets.length === 0 ? (
                                        <div className="text-center text-gray-500 py-20 italic">No available jobs match your skills currently.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                            {availableTickets.map(renderTicketCard)}
                                        </div>
                                    )
                                )}
                                {activeTab === 'OPEN' && (
                                    openTickets.length === 0 ? (
                                        <div className="text-center text-gray-500 py-20 italic">No open maintenance requests at this time.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                            {openTickets.map(renderTicketCard)}
                                        </div>
                                    )
                                )}
                                {activeTab === 'IN_PROGRESS' && (
                                    inProgressTickets.length === 0 ? (
                                        <div className="text-center text-gray-500 py-20 italic">You have no tasks currently in progress.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                            {inProgressTickets.map(renderTicketCard)}
                                        </div>
                                    )
                                )}
                                {activeTab === 'RESOLVED' && (
                                    resolvedTickets.length === 0 ? (
                                        <div className="text-center text-gray-500 py-20 italic">No resolved tasks yet.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                                            {resolvedTickets.map(renderTicketCard)}
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MaintenanceDashboard;
