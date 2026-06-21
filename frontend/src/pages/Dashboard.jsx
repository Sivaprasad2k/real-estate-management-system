import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';
import CustomSelect from '../components/CustomSelect';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Data States
    const [properties, setProperties] = useState([]);
    const [allProperties, setAllProperties] = useState([]);
    const [featuredProperties, setFeaturedProperties] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [visits, setVisits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dynamic User Analytics Stats
    const [stats, setStats] = useState({
        listed: 0,
        available: 0,
        sold: 0,
        rented: 0,
        maintenance: 0
    });

    // Local Search Filters
    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        city: searchParams.get('city') || '',
        type: searchParams.get('type') || '',
        purpose: searchParams.get('purpose') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        bedrooms: searchParams.get('bedrooms') || '',
    });

    // Sync search params from URL
    useEffect(() => {
        setFilters({
            keyword: searchParams.get('keyword') || '',
            city: searchParams.get('city') || '',
            type: searchParams.get('type') || '',
            purpose: searchParams.get('purpose') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            bedrooms: searchParams.get('bedrooms') || '',
        });
    }, [searchParams]);

    // Fetch user stats & site data
    const fetchDashboardData = async () => {
        if (!user?.id) return;
        try {
            const [propertiesRes, maintOwnerRes, maintTenantRes, notificationsRes, visitsOwnerRes, visitsBuyerRes, recommendationsRes] = await Promise.all([
                api.get('/properties'),
                api.get('/maintenance/owner').catch(() => ({ data: [] })),
                api.get('/maintenance/tenant').catch(() => ({ data: [] })),
                api.get('/notifications').catch(() => ({ data: [] })),
                api.get('/visits/owner').catch(() => ({ data: [] })),
                api.get('/visits/buyer').catch(() => ({ data: [] })),
                api.get('/properties/recommendations?limit=4').catch(() => ({ data: [] }))
            ]);

            const allProps = propertiesRes.data;
            setAllProperties(allProps);
            setFeaturedProperties(recommendationsRes.data || []);

            const userProperties = allProps.filter(p => p.ownerId === user.id);
            const listed = userProperties.length;
            const available = userProperties.filter(p => p.status === 'AVAILABLE' || p.status === 'APPROVED').length;
            const sold = userProperties.filter(p => p.status === 'SOLD').length;
            const rented = userProperties.filter(p => p.status === 'RENTED').length;
            const maintenance = maintOwnerRes.data.length + maintTenantRes.data.length;

            setStats({ listed, available, sold, rented, maintenance });
            setNotifications(notificationsRes.data.slice(0, 5)); // top 5 recent notifications

            const combinedVisits = [...(visitsOwnerRes.data || []), ...(visitsBuyerRes.data || [])];
            combinedVisits.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));
            setVisits(combinedVisits);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        }
    };

    const handleUpdateVisitStatus = async (visitId, status) => {
        try {
            await api.put(`/visits/${visitId}/status`, { status });
            alert(`Visit request has been ${status.toLowerCase()}!`);
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data || "Failed to update visit status");
        }
    };

    // Main fetch for listings based on search filters
    const fetchMarketplaceListings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const isNearby = searchParams.get('isNearby') === 'true';
            const lat = searchParams.get('lat');
            const lng = searchParams.get('lng');

            let response;
            if (isNearby && lat && lng) {
                response = await api.get(`/properties/nearby?latitude=${lat}&longitude=${lng}&distance=20`);
            } else {
                response = await api.post('/properties/advanced-search', {
                    keyword: searchParams.get('keyword') || null,
                    purpose: searchParams.get('purpose') || null,
                    type: searchParams.get('type') || null,
                    minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : null,
                    maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : null,
                });
            }

            // Filter out properties owned by current user for discovery
            const filteredProperties = response.data.filter(
                property => property.ownerId !== user?.id
            );
            setProperties(filteredProperties);
        } catch (err) {
            console.error("Failed to load marketplace listings:", err);
            setError("Could not load properties at this time. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        fetchMarketplaceListings();
    }, [user?.id, searchParams]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (filters.keyword) params.set('keyword', filters.keyword);
        if (filters.city) params.set('city', filters.city);
        if (filters.type) params.set('type', filters.type);
        if (filters.purpose) params.set('purpose', filters.purpose);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
        setSearchParams(params);
    };

    // Client-side filtering logic for beds and location (city) matching URL params
    const filteredListings = properties.filter(property => {
        const urlBedrooms = searchParams.get('bedrooms');
        const urlCity = searchParams.get('city');
        if (urlBedrooms && property.bedrooms < parseInt(urlBedrooms)) return false;
        if (urlCity && !property.city.toLowerCase().includes(urlCity.toLowerCase())) return false;
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE':
            case 'APPROVED':
                return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'RENTED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'SOLD':
                return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'SALE_IN_PROGRESS':
            case 'RENT_IN_PROGRESS':
            case 'PENDING_BUYER_CONFIRMATION':
            case 'PENDING_TENANT_CONFIRMATION':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            default:
                return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1 space-y-10 min-w-0 pr-2">
                {/* ZONE 1 : OVERVIEW + OPERATIONS */}
                <div className="space-y-6">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-dark-card to-dark/50 border border-dark-border rounded-xl p-8 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                        <h1 className="text-3xl font-serif text-white tracking-wide">
                            {getGreeting()}, <span className="gold-gradient-text font-semibold">{user?.name || user?.username || 'Guest'}</span>
                        </h1>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'Total Listed', value: stats.listed, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                            { label: 'Available', value: stats.available, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
                            { label: 'Sold Listings', value: stats.sold, icon: 'M9.504 1.172a3 3 0 012.122 0l8.283 8.282a3 3 0 010 4.243l-6.162 6.162a3 3 0 01-4.243 0L1.222 11.577a3 3 0 010-4.242L9.504 1.172zM10 5a1 1 0 100 2 1 1 0 000-2z' },
                            { label: 'Rented Listings', value: stats.rented, icon: 'M15 7a2 2 0 012 2m-2 4a5 5 0 11-7.07-7.07l1.414-1.414A5 5 0 0115 13zm0 0l-3.414-3.414' },
                            { label: 'Maintenance Tickets', value: stats.maintenance, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-dark-card border border-dark-border/80 rounded-xl p-4 flex items-center justify-between hover:border-brand/40 hover:shadow-[0_4px_25px_rgba(212,175,55,0.05)] transition-all duration-300 group">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{item.label}</p>
                                    <p className="text-2xl font-serif text-white font-bold group-hover:text-brand transition-colors duration-300">{item.value}</p>
                                </div>
                                <div className="p-2.5 bg-dark border border-dark-border rounded-lg text-brand group-hover:bg-brand/10 transition-colors duration-300 shrink-0 ml-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Marketplace Search */}
                    <Card className="border border-dark-border p-6 bg-gradient-to-b from-dark-card to-dark-card/90 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
                        <form onSubmit={handleSearchSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Keyword</label>
                                    <input
                                        type="text"
                                        value={filters.keyword}
                                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                        placeholder="E.g. Penthouse, Pool..."
                                        className="w-full bg-[#0B0B0B] border border-dark-border rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-brand/60 outline-none text-xs transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Location</label>
                                    <input
                                        type="text"
                                        value={filters.city}
                                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                        placeholder="City..."
                                        className="w-full bg-[#0B0B0B] border border-dark-border rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-brand/60 outline-none text-xs transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Property Type</label>
                                    <CustomSelect
                                        value={filters.type}
                                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                        placeholder="All Types"
                                        options={[
                                            { value: '', label: 'All Types' },
                                            { value: 'APARTMENT', label: 'Apartment' },
                                            { value: 'HOUSE', label: 'House' },
                                            { value: 'VILLA', label: 'Villa' },
                                            { value: 'COMMERCIAL', label: 'Commercial' },
                                            { value: 'LAND', label: 'Land' }
                                        ]}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Purpose</label>
                                    <CustomSelect
                                        value={filters.purpose}
                                        onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                                        placeholder="Any Purpose"
                                        options={[
                                            { value: '', label: 'Any Purpose' },
                                            { value: 'BUY', label: 'For Sale' },
                                            { value: 'RENT', label: 'For Rent' }
                                        ]}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Min Price (₹)</label>
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                        placeholder="Min..."
                                        className="w-full bg-[#0B0B0B] border border-dark-border rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-brand/60 outline-none text-xs transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Max Price (₹)</label>
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                        placeholder="Max..."
                                        className="w-full bg-[#0B0B0B] border border-dark-border rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:border-brand/60 outline-none text-xs transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Beds</label>
                                    <CustomSelect
                                        value={filters.bedrooms}
                                        onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                                        placeholder="Any"
                                        options={[
                                            { value: '', label: 'Any' },
                                            { value: '1', label: '1+ Beds' },
                                            { value: '2', label: '2+ Beds' },
                                            { value: '3', label: '3+ Beds' },
                                            { value: '4', label: '4+ Beds' }
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="bg-brand text-dark-DEFAULT px-8 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-brand-400 hover:shadow-[0_0_15px_rgba(218,165,32,0.3)] transition-all duration-300 cursor-pointer"
                                >
                                    Search Marketplace
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'List Property', path: '/add-property', desc: 'Create new listing', style: 'hover:border-brand border-dark-border bg-brand/5 text-brand hover:shadow-brand/5' },
                            { label: 'Open Chats', path: '/my-inquiries', desc: 'Review active chats', style: 'hover:border-purple-500/50 border-dark-border bg-purple-500/5 text-purple-400 hover:shadow-purple-500/5' },
                            { label: 'Maintenance Requests', path: '/my-maintenance', desc: 'File repair tickets', style: 'hover:border-orange-500/50 border-dark-border bg-orange-500/5 text-orange-400 hover:shadow-orange-500/5' },
                            { label: 'My Transactions', path: '/my-transactions', desc: 'Purchases & Rentals', style: 'hover:border-green-500/50 border-dark-border bg-green-500/5 text-green-400 hover:shadow-green-500/5' }
                        ].map((action, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate(action.path)}
                                className={`border p-6 rounded-xl cursor-pointer hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-[120px] shadow-sm ${action.style}`}
                            >
                                <span className="text-xs font-bold uppercase tracking-wider">{action.label}</span>
                                <span className="text-[10px] text-gray-400 font-light mt-1">{action.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ZONE 2 : FEATURED PROPERTIES */}
                {featuredProperties.length > 0 && !searchParams.get('keyword') && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-serif text-brand tracking-wider flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.772-.563-.373-1.81.587-1.81H7.89a1 1 0 00.95-.69l1.519-4.674z" />
                                </svg>
                                Promoted Premium Properties
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredProperties.map((property) => (
                                <div
                                    key={`feat-${property.id}`}
                                    onClick={() => navigate(`/property/${property.id}`)}
                                    className="bg-gradient-to-b from-[#181818] to-[#121212] hover:from-[#1e1e1e] hover:to-[#161616] rounded-xl overflow-hidden border border-brand/20 shadow-lg hover:shadow-brand/5 cursor-pointer flex flex-col h-full group transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="h-44 bg-[#0a0a0a] relative overflow-hidden shrink-0 border-b border-dark-border/40">
                                        {property.images && property.images.length > 0 ? (
                                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-light text-[10px] tracking-wider">
                                                <span>NO PROPERTY IMAGES</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2.5 left-2.5 text-brand text-[9px] tracking-widest uppercase font-bold bg-[#0d0d0d]/95 backdrop-blur-sm px-2.5 py-0.5 rounded border border-brand/35">FEATURED</div>
                                        <span className="absolute bottom-2.5 right-2.5 bg-dark/85 border border-dark-border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase text-brand tracking-widest">
                                            {property.type}
                                        </span>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1 justify-between">
                                        <div>
                                            <p className="text-lg font-serif text-brand font-bold mb-1">
                                                ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                                            </p>
                                            <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-brand transition-colors font-serif leading-snug">{property.title}</h3>
                                            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                {property.city}, {property.state}
                                            </p>
                                        </div>
                                        <div className="pt-3 mt-4 border-t border-dark-border/20">
                                            <button className="w-full bg-transparent hover:bg-brand/10 border border-brand/40 text-brand text-[9px] tracking-widest uppercase font-bold py-2 rounded transition-all duration-300">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ZONE 3 : MARKETPLACE LISTINGS */}
                <div className="space-y-4">
                    <h2 className="text-xl font-serif text-white tracking-wide">Latest Marketplace Listings</h2>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-xs font-light">
                            <span>{error}</span>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="bg-dark-card border border-dark-border rounded-xl h-[360px] overflow-hidden">
                                    <div className="h-48 bg-dark/60"></div>
                                    <div className="p-5 space-y-3">
                                        <div className="h-6 bg-dark/60 rounded w-1/3"></div>
                                        <div className="h-4 bg-dark/60 rounded w-2/3"></div>
                                        <div className="h-4 bg-dark/60 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="p-4 bg-dark border border-dark-border text-gray-500 rounded-full">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-white text-base font-serif font-semibold">No Properties Found</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-sm">Try adjusting your filters or keyword query to discover active listings.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setFilters({ keyword: '', city: '', type: '', purpose: '', minPrice: '', maxPrice: '', bedrooms: '' });
                                    setSearchParams(new URLSearchParams());
                                }}
                                className="border border-brand/50 text-brand bg-brand/5 hover:bg-brand hover:text-dark px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all"
                            >
                                Reset Search Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredListings.map((property) => (
                                <div
                                    key={property.id}
                                    onClick={() => navigate(`/property/${property.id}`)}
                                    className="bg-dark-card rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 border border-dark-border hover:border-brand/35 cursor-pointer flex flex-col h-full group"
                                >
                                    <div className="h-48 bg-[#0a0a0a] relative shrink-0 overflow-hidden border-b border-dark-border/40">
                                        {property.images && property.images.length > 0 ? (
                                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-light text-xs">
                                                <span>NO PROPERTY IMAGES</span>
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <span className={`absolute top-3 left-3 border backdrop-blur-md px-2.5 py-1 rounded text-[9px] uppercase font-bold tracking-wider ${getStatusColor(property.status)}`}>
                                            {property.status === 'APPROVED' || property.status === 'AVAILABLE' ? 'Available' : property.status.replace(/_/g, ' ')}
                                        </span>

                                        {/* Listing Purpose */}
                                        <span className="absolute bottom-3 right-3 bg-dark/75 border border-dark-border backdrop-blur-md px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase text-brand tracking-widest">
                                            For {property.purpose === 'RENT' ? 'Rent' : 'Sale'}
                                        </span>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1 justify-between space-y-3">
                                        <div className="space-y-2">
                                            <p className="text-xl font-serif text-brand font-bold">
                                                ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                                                {property.purpose === 'RENT' && <span className="text-[10px] text-gray-500 font-sans font-normal tracking-wide"> / mo</span>}
                                            </p>
                                            <h3 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-brand transition-colors font-serif leading-snug">{property.title}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                {property.city}, {property.state}
                                            </p>
                                        </div>


                                        <div className="pt-2">
                                            <button className="w-full bg-transparent hover:bg-brand/10 border border-brand/40 text-brand text-[9px] tracking-widest uppercase font-bold py-2 rounded transition-all duration-300">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* VISITS & RECENT OPERATIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Site Visits Section */}
                    <Card className="border border-dark-border p-6 bg-gradient-to-b from-dark-card to-dark-card/95">
                        <h2 className="text-base font-serif text-white tracking-wider flex items-center justify-between pb-3 border-b border-dark-border/40 mb-4">
                            Upcoming Site Visits
                            <span className="text-[9px] text-brand tracking-widest uppercase font-bold px-2 py-0.5 bg-brand/10 border border-brand/20 rounded">
                                SCHEDULE
                            </span>
                        </h2>
                        <div className="divide-y divide-dark-border/30 max-h-72 overflow-y-auto pr-1">
                            {visits.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 text-xs italic font-light">
                                    No upcoming visits scheduled
                                </div>
                            ) : (
                                visits.map((visit) => (
                                    <div key={visit.id} className="py-4 space-y-2 hover:bg-white/[0.01] transition-colors">
                                        <div className="flex justify-between items-center text-[10px] font-semibold">
                                            <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                                                visit.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                visit.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                            }`}>
                                                {visit.status}
                                            </span>
                                            <span className="text-gray-500 font-light">
                                                {new Date(visit.visitDate).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-300 font-light">
                                            Property ID: <span className="font-semibold text-white">{visit.propertyId}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500">
                                            Role: {visit.ownerId === user?.id ? 'Owner' : 'Buyer'}
                                        </p>
                                        {visit.status === 'PENDING' && visit.ownerId === user?.id && (
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => handleUpdateVisitStatus(visit.id, 'ACCEPTED')}
                                                    className="px-2.5 py-1 bg-green-500 text-dark-DEFAULT rounded text-[9px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateVisitStatus(visit.id, 'REJECTED')}
                                                    className="px-2.5 py-1 bg-red-500 text-white rounded text-[9px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Timeline of Recent Operations */}
                    <Card className="border border-dark-border p-6 bg-gradient-to-b from-dark-card to-dark-card/95">
                        <h2 className="text-base font-serif text-white tracking-wider flex items-center justify-between pb-3 border-b border-dark-border/40 mb-4">
                            Recent Operations Logs
                            <span className="text-[9px] text-brand tracking-widest uppercase font-bold px-2 py-0.5 bg-brand/10 border border-brand/20 rounded">
                                TIMELINE
                            </span>
                        </h2>
                        <div className="space-y-6 max-h-72 overflow-y-auto pr-1">
                            {notifications.length === 0 ? (
                                <div className="py-8 text-center text-gray-500 text-xs italic font-light">
                                    No recent operations logged
                                </div>
                            ) : (
                                <div className="relative border-l border-dark-border/60 ml-2.5 space-y-6 py-2">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className="relative pl-6 group">
                                            {/* Bullet pin */}
                                            <div className="absolute -left-[5.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand border border-dark shadow-[0_0_8px_rgba(212,175,55,0.4)]"></div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold tracking-wider uppercase text-brand">
                                                        {notif.type || 'SYSTEM'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-500 font-light">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-300 font-light leading-relaxed">{notif.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
