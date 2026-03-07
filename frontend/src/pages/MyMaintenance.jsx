import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import api from '../api/axios';
import MaintenanceRequestsList from '../components/MaintenanceRequestsList';
import UserSidebar from '../components/UserSidebar';

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
                                <div className="bg-[#121212] border border-brand-500/20 p-6 rounded-xl mb-8 shadow-lg relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
                                    <h3 className="text-lg font-medium text-white mb-6">Submit New Request</h3>
                                    <form onSubmit={handleCreateMaintenance} className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Property</label>
                                                <select required value={maintenanceForm.propertyId} onChange={e => setMaintenanceForm({ ...maintenanceForm, propertyId: e.target.value })} className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-brand-500 outline-none">
                                                    <option value="">Select Property</option>
                                                    {rentals.map(r => (
                                                        <option key={r.propertyId} value={r.propertyId}>{r.propertyTitle || 'Property ' + r.propertyId}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Maintenance Type</label>
                                                <select value={maintenanceForm.type} onChange={e => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })} className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-brand-500 outline-none">
                                                    <option value="GENERAL">General Maintenance</option>
                                                    <option value="PLUMBING">Plumbing</option>
                                                    <option value="ELECTRICAL">Electrical</option>
                                                    <option value="HVAC">HVAC / AC</option>
                                                    <option value="APPLIANCE">Appliance Repair</option>
                                                </select>
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
                                <Card>
                                    <p className="text-gray-400 py-4">You have no active maintenance requests.</p>
                                </Card>
                            ) : (
                                <div className="space-y-4 mb-10">
                                    {myMaintenance.map(ticket => (
                                        <div key={ticket.id} className="bg-dark-card border border-dark-border rounded-lg p-5 flex flex-col hover:border-brand-500/30 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">{ticket.title}</h3>
                                                    <p className="text-[11px] font-bold tracking-wider uppercase text-brand-400 mt-1">{ticket.propertyTitle || 'Your Property'} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="bg-[#121212] text-brand-300 border border-dark-border px-2.5 py-1 rounded text-[10px] uppercase tracking-wider font-bold">
                                                        {ticket.type || 'GENERAL'}
                                                    </span>
                                                    <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider shadow-sm ${ticket.status === 'OPEN' ? 'bg-yellow-900/60 text-yellow-500' : ticket.status === 'IN_PROGRESS' ? 'bg-blue-900/60 text-blue-400' : ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' ? 'bg-green-900/60 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                                        {ticket.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-300 bg-[#121212] border border-dark-border p-3 rounded-md line-clamp-3 leading-relaxed hidden-scroll overflow-y-auto max-h-24 hover:line-clamp-none">{ticket.description}</p>
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
