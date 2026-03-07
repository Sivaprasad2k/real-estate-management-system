import React, { useState, useEffect } from 'react';
import api from '../api/axios';

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
            // Refresh list
            fetchRequests();
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        }
    };

    if (isLoading) return <div className="text-gray-400 text-sm animate-pulse">Loading requests...</div>;
    if (error) return <div className="text-red-500 text-sm p-4 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>;

    if (requests.length === 0) {
        return (
            <div className="bg-dark border border-dark-border rounded-xl p-8 text-center mt-6">
                <p className="text-gray-400 text-sm">No maintenance requests from your tenants found.</p>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 gold-gradient-text border-b border-dark-border pb-2 inline-block">Tenant Maintenance Requests</h3>
            <div className="overflow-x-auto mt-2 rounded-xl border border-dark-border">
                <table className="w-full text-left text-sm text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-dark-card/50 border-b border-dark-border">
                        <tr>
                            <th className="px-5 py-4 font-medium tracking-wider">Issue Title</th>
                            <th className="px-5 py-4 font-medium tracking-wider">Tenant</th>
                            <th className="px-5 py-4 font-medium tracking-wider">Status</th>
                            <th className="px-5 py-4 font-medium tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border bg-dark">
                        {requests.map(req => (
                            <tr key={req.id} className="hover:bg-dark-card/50 transition-colors">
                                <td className="px-5 py-4">
                                    <p className="font-medium text-white">{req.title}</p>
                                    <p className="text-xs text-brand-400 mt-1.5">{req.description}</p>
                                </td>
                                <td className="px-5 py-4 font-medium text-gray-200">
                                    {req.tenantName}
                                </td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${req.status === 'OPEN' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                                        req.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' :
                                            'bg-green-500/10 text-green-500 border-green-500/30'
                                        }`}>
                                        {req.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    {req.status === 'OPEN' && (
                                        <button
                                            onClick={() => handleUpdateStatus(req.id, 'IN_PROGRESS')}
                                            className="ml-2 text-xs text-blue-400 hover:text-blue-300 transition-colors uppercase font-bold tracking-wider"
                                        >
                                            Start Work
                                        </button>
                                    )}
                                    {(req.status === 'OPEN' || req.status === 'IN_PROGRESS') && (
                                        <button
                                            onClick={() => handleUpdateStatus(req.id, 'RESOLVED')}
                                            className="ml-4 text-xs text-green-400 hover:text-green-300 transition-colors uppercase font-bold tracking-wider"
                                        >
                                            Resolve
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaintenanceRequestsList;
