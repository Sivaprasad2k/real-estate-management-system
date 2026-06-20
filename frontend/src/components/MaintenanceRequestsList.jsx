import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const TicketTimeline = ({ status }) => {
    const statuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
    const labels = ['Created', 'Assigned', 'In Progress', 'Completed', 'Closed'];
    const currentIndex = statuses.indexOf(status);

    return (
        <div className="flex items-center w-full justify-between mt-4 border-t border-dark-border/40 pt-4 relative">
            {labels.map((label, idx) => {
                const isCompleted = idx <= currentIndex;
                const isActive = idx === currentIndex;
                return (
                    <div key={label} className="flex flex-col items-center flex-1 relative z-10">
                        {/* Connecting line segment */}
                        {idx > 0 && (
                            <div className={`absolute top-2.5 left-[-50%] right-[50%] h-[2px] -z-10 ${
                                idx <= currentIndex ? 'bg-brand' : 'bg-dark-border'
                            }`}></div>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isActive ? 'bg-brand border-brand ring-4 ring-brand-500/25 scale-110' :
                            isCompleted ? 'bg-brand/20 border-brand text-brand' :
                            'bg-[#0B0B0B] border-dark-border text-dark-muted'
                        }`}>
                            {isCompleted && idx < currentIndex && (
                                <svg className="w-2.5 h-2.5 text-brand" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-[8px] uppercase font-bold tracking-widest mt-2 ${
                            isActive ? 'text-brand font-extrabold' : 'text-dark-muted'
                        }`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const MaintenanceRequestsList = ({ ownerId }) => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/maintenance/owner`);
            setRequests(response.data);
        } catch (err) {
            console.error("Failed to fetch maintenance requests", err);
            setError("Could not load maintenance requests.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (ownerId) {
            fetchRequests();
        }
    }, [ownerId]);

    const handleUpdateStatus = async (requestId, newStatus) => {
        try {
            await api.put(`/maintenance/${requestId}/status?status=${newStatus}`);
            fetchRequests();
        } catch (err) {
            console.error("Failed to update status", err);
            alert(err.response?.data || "Failed to update status");
        }
    };

    if (isLoading) return <div className="text-dark-muted text-xs animate-pulse">Loading incoming requests...</div>;
    if (error) return <div className="text-error text-xs p-4 bg-error/10 rounded-lg border border-error/30">{error}</div>;

    if (requests.length === 0) {
        return (
            <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center mt-6">
                <p className="text-dark-muted text-xs italic">No maintenance requests submitted by your tenants yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-8">
            <h3 className="text-xl font-serif text-brand border-b border-dark-border/40 pb-3">
                Tenant Maintenance Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map(req => (
                    <div
                        key={req.id}
                        className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand-500/25 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between"
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-md font-semibold text-white tracking-wide">{req.title}</h4>
                                    <p className="text-[10px] text-brand uppercase font-bold tracking-widest mt-1">Tenant: {req.tenantName}</p>
                                </div>
                                <span className="text-[9px] bg-brand/5 border border-brand/20 text-brand px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    {req.type || 'GENERAL'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-300 leading-relaxed font-light bg-[#0B0B0B] border border-dark-border/60 p-3 rounded-lg max-h-24 overflow-y-auto hidden-scroll">
                                {req.description}
                            </p>
                        </div>

                        {/* Interactive timeline stepper */}
                        <TicketTimeline status={req.status} />

                        {req.status === 'COMPLETED' && (
                            <div className="mt-5 pt-3 border-t border-dark-border/40 flex justify-end">
                                <button
                                    onClick={() => handleUpdateStatus(req.id, 'CLOSED')}
                                    className="bg-success text-dark-DEFAULT px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-success/15"
                                >
                                    Approve Completion
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MaintenanceRequestsList;
