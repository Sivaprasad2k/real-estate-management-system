import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import api from '../api/axios';
import MaintenanceRequestsList from '../components/MaintenanceRequestsList';
import UserSidebar from '../components/UserSidebar';
import CustomSelect from '../components/CustomSelect';

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
                        {/* Connecting line */}
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
                        <span className={`text-[7px] sm:text-[8px] text-center uppercase font-bold tracking-wider sm:tracking-widest mt-2 ${
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

const MyMaintenance = () => {
    const { user } = useAuth();
    const [rentals, setRentals] = useState([]);
    const [myMaintenance, setMyMaintenance] = useState([]);
    const [maintenanceForm, setMaintenanceForm] = useState({ propertyId: '', title: '', description: '', type: 'GENERAL' });
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchMaintenanceData = async () => {
            setIsLoading(true);
            try {
                // Fetch rentals for tenant
                try {
                    const rentalsRes = await api.get('/rentals/tenant');
                    setRentals(rentalsRes.data.filter(r => r.status === 'ACTIVE'));
                } catch (e) { console.error("Rentals fetch error", e); }

                // Fetch maintenance tickets for tenant
                try {
                    const maintRes = await api.get('/maintenance/tenant');
                    setMyMaintenance(maintRes.data);
                } catch (e) { console.error("Maintenance fetch error", e); }
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) fetchMaintenanceData();
    }, [user?.id]);

    const handleCreateMaintenance = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/maintenance/${maintenanceForm.propertyId}`, {
                title: maintenanceForm.title,
                description: maintenanceForm.description,
                type: maintenanceForm.type
            });
            setMyMaintenance([res.data, ...myMaintenance]);
            setShowMaintenanceForm(false);
            setMaintenanceForm({ propertyId: '', title: '', description: '', type: 'GENERAL' });
        } catch (err) {
            alert(err.response?.data || "Failed to create maintenance ticket");
        }
    };

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1 space-y-8">


                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    </div>
                ) : (
                    <>
                        <section>
                            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-200">Tenant Requests</h2>
                                    <p className="text-sm text-gray-400 mt-1 hover:text-gray-300">Issues you've reported for properties you rent.</p>
                                </div>
                                {rentals.length > 0 && (
                                    <button
                                        onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                                        className="bg-brand-600/20 text-brand-400 border border-brand-500/30 px-5 py-2 rounded-md font-medium text-sm hover:bg-brand-600/30 transition-colors shadow-sm"
                                    >
                                        + Request Maintenance
                                    </button>
                                )}
                            </div>

                            {showMaintenanceForm && (
                                <div className="bg-[#121212] border border-brand-500/20 p-6 rounded-xl mb-8 shadow-lg relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 rounded-l-xl"></div>
                                    <h3 className="text-lg font-medium text-white mb-6">Submit New Request</h3>
                                    <form onSubmit={handleCreateMaintenance} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Property *</label>
                                                <CustomSelect
                                                    required
                                                    value={maintenanceForm.propertyId}
                                                    onChange={e => setMaintenanceForm({ ...maintenanceForm, propertyId: e.target.value })}
                                                    placeholder="Select Property"
                                                    options={rentals.map(r => ({ value: r.propertyId, label: r.propertyTitle || 'Property ' + r.propertyId }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Maintenance Type</label>
                                                <CustomSelect
                                                    value={maintenanceForm.type}
                                                    onChange={e => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                                                    options={[
                                                        { value: 'GENERAL', label: 'General Maintenance' },
                                                        { value: 'PLUMBING', label: 'Plumbing' },
                                                        { value: 'ELECTRICAL', label: 'Electrical' },
                                                        { value: 'HVAC', label: 'HVAC / AC' },
                                                        { value: 'APPLIANCE', label: 'Appliance Repair' }
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Issue Title</label>
                                            <input required type="text" value={maintenanceForm.title} onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })} className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-brand-500 outline-none" placeholder="e.g. Leaking Faucet" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</label>
                                            <textarea required rows="4" value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-brand-500 outline-none resize-none" placeholder="Describe the issue in detail..."></textarea>
                                        </div>
                                        <div className="flex justify-end gap-4 pt-2">
                                            <button type="button" onClick={() => setShowMaintenanceForm(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-dark-card transition-colors">Cancel</button>
                                            <button type="submit" className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium tracking-wide hover:bg-brand-700 transition-colors shadow-sm">Submit Request</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {myMaintenance.length === 0 ? (
                                /* Phase 10: Empty State */
                                <div className="bg-dark-card border border-dark-border rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4">
                                    <div className="p-3 bg-dark border border-dark-border text-dark-muted rounded-full">
                                        <svg className="w-8 h-8 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-white text-md font-semibold tracking-wide">No Active Maintenance Tickets</h3>
                                        <p className="text-xs text-dark-muted mt-1 max-w-sm mx-auto">You have no active maintenance tickets registered in your portal.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    {myMaintenance.map(ticket => (
                                        <div key={ticket.id} className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand-500/25 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-md font-semibold text-white tracking-wide">{ticket.title}</h3>
                                                        <p className="text-[10px] text-brand uppercase font-bold tracking-widest mt-1">
                                                            {ticket.propertyTitle || 'Your Property'} • {new Date(ticket.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-[9px] bg-brand/5 border border-brand/20 text-brand px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        {ticket.type || 'GENERAL'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-300 leading-relaxed font-light bg-[#0B0B0B] border border-dark-border/60 p-3 rounded-lg max-h-24 overflow-y-auto hidden-scroll">
                                                    {ticket.description}
                                                </p>
                                            </div>
                                            <TicketTimeline status={ticket.status} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="pt-8 border-t border-dark-border">
                            <MaintenanceRequestsList ownerId={user?.id} />
                        </section>
                    </>
                )}
            </main>
        </div>
    );
};

export default MyMaintenance;
