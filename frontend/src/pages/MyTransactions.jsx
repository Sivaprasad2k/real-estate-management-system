import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';

const MyTransactions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data states
    const [purchaseRequests, setPurchaseRequests] = useState([]);
    const [rentalRequests, setRentalRequests] = useState([]);
    const [allProperties, setAllProperties] = useState([]);
    const [activeTab, setActiveTab] = useState('purchases'); // purchases, rentals, deals, saved, recent
    const [isLoading, setIsLoading] = useState(true);
    const [savedIds, setSavedIds] = useState([]);
    const [recentIds, setRecentIds] = useState([]);

    useEffect(() => {
        // Load saved and recently viewed IDs from local storage
        const saved = JSON.parse(localStorage.getItem('saved_properties') || '[]');
        const recent = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
        setSavedIds(saved);
        setRecentIds(recent);
        fetchTransactionData();
    }, [user?.id]);

    const fetchTransactionData = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const [purchasesRes, rentalsRes, propertiesRes] = await Promise.all([
                api.get('/purchase-requests/buyer').catch(() => ({ data: [] })),
                api.get('/rental-requests/tenant').catch(() => ({ data: [] })),
                api.get('/properties').catch(() => ({ data: [] }))
            ]);

            setPurchaseRequests(purchasesRes.data);
            setRentalRequests(rentalsRes.data);
            setAllProperties(propertiesRes.data);
        } catch (err) {
            console.error("Failed to fetch transaction data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPurchase = async (propertyId) => {
        try {
            await api.put(`/properties/${propertyId}/sale/approve`);
            alert("Purchase confirmed! Property status is now SOLD.");
            fetchTransactionData();
        } catch (err) {
            alert(err.response?.data || "Failed to confirm purchase");
        }
    };

    const handleConfirmLease = async (propertyId) => {
        try {
            await api.post(`/rentals/${propertyId}/verify`);
            alert("Lease confirmed! Property status is now RENTED.");
            fetchTransactionData();
        } catch (err) {
            alert(err.response?.data || "Failed to confirm lease");
        }
    };

    const toggleBookmark = (propertyId, e) => {
        e.stopPropagation();
        const updated = savedIds.includes(propertyId)
            ? savedIds.filter(id => id !== propertyId)
            : [...savedIds, propertyId];
        setSavedIds(updated);
        localStorage.setItem('saved_properties', JSON.stringify(updated));
    };

    // Filter Helpers
    const getPendingPurchases = () => {
        // Properties where status is SALE_IN_PROGRESS or PENDING_BUYER_CONFIRMATION and user is buyer
        return allProperties.filter(p => 
            (p.status === 'SALE_IN_PROGRESS' || p.status === 'PENDING_BUYER_CONFIRMATION') &&
            p.saleInitiatedBy === user.id
        );
    };

    const getPendingRentals = () => {
        // Properties where status is RENT_IN_PROGRESS or PENDING_TENANT_CONFIRMATION and user is tenant
        return allProperties.filter(p => 
            (p.status === 'RENT_IN_PROGRESS' || p.status === 'PENDING_TENANT_CONFIRMATION') &&
            p.tenantId === user.id
        );
    };

    const getCompletedDeals = () => {
        // SOLD properties where buyer is user, or RENTED properties where tenant is user
        return allProperties.filter(p => 
            (p.status === 'SOLD' && p.saleInitiatedBy === user.id) ||
            (p.status === 'RENTED' && p.tenantId === user.id)
        );
    };

    const getSavedProperties = () => {
        return allProperties.filter(p => savedIds.includes(p.id));
    };

    const getRecentlyViewedProperties = () => {
        // Return in the order they were viewed
        return recentIds
            .map(id => allProperties.find(p => p.id === id))
            .filter(Boolean);
    };

    const getStatusText = (status) => {
        if (status === 'SALE_IN_PROGRESS') return 'Awaiting Agreement Upload';
        if (status === 'RENT_IN_PROGRESS') return 'Awaiting Agreement Upload';
        if (status === 'PENDING_BUYER_CONFIRMATION') return 'Action Required: Confirm Agreement';
        if (status === 'PENDING_TENANT_CONFIRMATION') return 'Action Required: Confirm Lease';
        return status;
    };

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1 space-y-8 min-w-0 pr-2">
                <div className="border-b border-dark-border pb-6">
                    <h1 className="text-3xl font-serif text-white tracking-wide">My Transactions</h1>
                    <p className="text-xs text-gray-400 mt-2 font-light">Track your pending purchases, rental agreements, closed deals, and bookmarked listings.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-dark-border/60 overflow-x-auto whitespace-nowrap hidden-scroll">
                    {[
                        { id: 'purchases', label: 'Pending Purchases', count: getPendingPurchases().length },
                        { id: 'rentals', label: 'Pending Rentals', count: getPendingRentals().length },
                        { id: 'deals', label: 'Completed Deals', count: getCompletedDeals().length },
                        { id: 'saved', label: 'Saved Properties', count: getSavedProperties().length },
                        { id: 'recent', label: 'Recently Viewed', count: getRecentlyViewedProperties().length }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`shrink-0 w-auto px-4 py-4 text-xs font-semibold tracking-widest uppercase transition-all relative ${
                                activeTab === tab.id ? 'text-brand' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 bg-brand/10 text-brand px-2 py-0.5 rounded-full text-[9px] border border-brand/20">
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand shadow-[0_-2px_10px_rgba(212,175,55,0.4)]"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Purchases Tab */}
                            {activeTab === 'purchases' && (
                                getPendingPurchases().length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 text-xs italic font-light">No pending purchase cases found. Click 'Request Purchase' on properties to initiate.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getPendingPurchases().map(prop => (
                                            <Card key={prop.id} className="border border-dark-border p-5 flex flex-col justify-between hover:border-brand/30 transition-all">
                                                <div className="flex gap-4">
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-dark">
                                                        {prop.images && prop.images.length > 0 ? (
                                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">NO IMAGE</div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-white font-serif truncate">{prop.title}</h3>
                                                        <p className="text-xs text-brand font-bold">₹{prop.price?.toLocaleString()}</p>
                                                        <p className="text-[10px] text-gray-400 font-light">{prop.city}, {prop.state}</p>
                                                        <div className="pt-2">
                                                            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                                                                {getStatusText(prop.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-dark-border/40 flex justify-between gap-3">
                                                    <button
                                                        onClick={() => navigate(`/property/${prop.id}`)}
                                                        className="flex-1 border border-dark-border text-white py-2 rounded text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                    {prop.status === 'PENDING_BUYER_CONFIRMATION' && (
                                                        <button
                                                            onClick={() => handleConfirmPurchase(prop.id)}
                                                            className="flex-1 bg-brand text-dark-DEFAULT py-2 rounded text-[10px] font-bold tracking-widest uppercase hover:bg-brand-400 transition-all"
                                                        >
                                                            Confirm Sale
                                                        </button>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Rentals Tab */}
                            {activeTab === 'rentals' && (
                                getPendingRentals().length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 text-xs italic font-light">No pending rental applications found.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getPendingRentals().map(prop => (
                                            <Card key={prop.id} className="border border-dark-border p-5 flex flex-col justify-between hover:border-brand/30 transition-all">
                                                <div className="flex gap-4">
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-dark">
                                                        {prop.images && prop.images.length > 0 ? (
                                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">NO IMAGE</div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-white font-serif truncate">{prop.title}</h3>
                                                        <p className="text-xs text-brand font-bold">₹{prop.price?.toLocaleString()} / mo</p>
                                                        <p className="text-[10px] text-gray-400 font-light">{prop.city}, {prop.state}</p>
                                                        <div className="pt-2">
                                                            <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                                                                {getStatusText(prop.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-dark-border/40 flex justify-between gap-3">
                                                    <button
                                                        onClick={() => navigate(`/property/${prop.id}`)}
                                                        className="flex-1 border border-dark-border text-white py-2 rounded text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
                                                    >
                                                        Details
                                                    </button>
                                                    {prop.status === 'PENDING_TENANT_CONFIRMATION' && (
                                                        <button
                                                            onClick={() => handleConfirmLease(prop.id)}
                                                            className="flex-1 bg-brand text-dark-DEFAULT py-2 rounded text-[10px] font-bold tracking-widest uppercase hover:bg-brand-400 transition-all"
                                                        >
                                                            Confirm Lease
                                                        </button>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Completed Deals Tab */}
                            {activeTab === 'deals' && (
                                getCompletedDeals().length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 text-xs italic font-light">No completed transactions registered to your account yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getCompletedDeals().map(prop => (
                                            <Card key={prop.id} className="border border-dark-border p-5 flex flex-col justify-between hover:border-brand/30 transition-all">
                                                <div className="flex gap-4">
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-dark">
                                                        {prop.images && prop.images.length > 0 ? (
                                                            <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-600">NO IMAGE</div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold text-white font-serif truncate">{prop.title}</h3>
                                                        <p className="text-xs text-brand font-bold">₹{prop.price?.toLocaleString()}{prop.status === 'RENTED' && ' / mo'}</p>
                                                        <p className="text-[10px] text-gray-400 font-light">{prop.city}, {prop.state}</p>
                                                        <div className="pt-2">
                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase border ${
                                                                prop.status === 'SOLD' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            }`}>
                                                                {prop.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-dark-border/40">
                                                    <button
                                                        onClick={() => navigate(`/property/${prop.id}`)}
                                                        className="w-full border border-dark-border text-white py-2 rounded text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all"
                                                    >
                                                        View Full Details
                                                    </button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Saved Tab */}
                            {activeTab === 'saved' && (
                                getSavedProperties().length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 text-xs italic font-light">No saved properties. Click the bookmark icon on property listings to save.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getSavedProperties().map(prop => (
                                            <div
                                                key={prop.id}
                                                onClick={() => navigate(`/property/${prop.id}`)}
                                                className="bg-dark-card rounded-xl overflow-hidden border border-dark-border hover:border-brand/35 cursor-pointer flex flex-col group transition-all"
                                            >
                                                <div className="h-40 bg-[#0a0a0a] relative">
                                                    {prop.images && prop.images.length > 0 ? (
                                                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-light text-xs">NO IMAGE</div>
                                                    )}
                                                    <button
                                                        onClick={(e) => toggleBookmark(prop.id, e)}
                                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-dark/80 text-brand border border-brand/20 hover:scale-110 transition-transform"
                                                    >
                                                        <svg className="w-4 h-4 fill-brand" viewBox="0 0 24 24">
                                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
                                                    <div>
                                                        <p className="text-base font-serif text-brand font-bold">₹{prop.price?.toLocaleString()}</p>
                                                        <h4 className="text-xs font-semibold text-white truncate font-serif leading-snug">{prop.title}</h4>
                                                        <p className="text-[10px] text-gray-500 mt-1">{prop.city}, {prop.state}</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-dark-border/25 text-[9px] uppercase tracking-wider text-brand font-bold text-center">
                                                        For {prop.purpose}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Recently Viewed Tab */}
                            {activeTab === 'recent' && (
                                getRecentlyViewedProperties().length === 0 ? (
                                    <div className="text-center py-16 text-gray-500 text-xs italic font-light">No recently viewed listings log. Navigate to property pages to register views.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {getRecentlyViewedProperties().map(prop => (
                                            <div
                                                key={`recent-${prop.id}`}
                                                onClick={() => navigate(`/property/${prop.id}`)}
                                                className="bg-dark-card rounded-xl overflow-hidden border border-dark-border hover:border-brand/35 cursor-pointer flex flex-col group transition-all"
                                            >
                                                <div className="h-40 bg-[#0a0a0a] relative">
                                                    {prop.images && prop.images.length > 0 ? (
                                                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-light text-xs">NO IMAGE</div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col flex-1 justify-between space-y-2">
                                                    <div>
                                                        <p className="text-base font-serif text-brand font-bold">₹{prop.price?.toLocaleString()}</p>
                                                        <h4 className="text-xs font-semibold text-white truncate font-serif leading-snug">{prop.title}</h4>
                                                        <p className="text-[10px] text-gray-500 mt-1">{prop.city}, {prop.state}</p>
                                                    </div>
                                                    <div className="pt-2 border-t border-dark-border/25 text-[9px] uppercase tracking-wider text-brand font-bold text-center">
                                                        For {prop.purpose}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyTransactions;
