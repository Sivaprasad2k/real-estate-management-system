import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Card from '../components/Card';
import Chat from '../components/Chat';
import MarkPropertyRentedForm from '../components/MarkPropertyRentedForm';
import MaintenanceRequestForm from '../components/MaintenanceRequestForm';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data States
    const [property, setProperty] = useState(null);
    const [owner, setOwner] = useState(null);
    const [ownerPropertiesCount, setOwnerPropertiesCount] = useState(0);
    const [relatedProperties, setRelatedProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Image Gallery State
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Modals & Chat Overlays
    const [showChat, setShowChat] = useState(false);
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [markForm, setMarkForm] = useState({ name: '', contact: '', amount: '', agreementFile: null });
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [initiateForm, setInitiateForm] = useState({ buyerDetails: '', agreementFile: null });
    const [showRentModal, setShowRentModal] = useState(false);
    const [rentMessage, setRentMessage] = useState('');
    const [rulesAccepted, setRulesAccepted] = useState(false);
    const [showLeaseModal, setShowLeaseModal] = useState(false);
    const [leaseFile, setLeaseFile] = useState(null);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminateReason, setTerminateReason] = useState('');
    const [tenanciesHistory, setTenanciesHistory] = useState([]);

    // Fetch primary property details
    const fetchPropertyData = async () => {
        try {
            const response = await api.get(`/properties/${id}`);
            const propData = response.data;
            setProperty(propData);
            setActiveImageIndex(0);

            // Fetch owner details and tenancy history
            if (propData.ownerId) {
                const [ownerRes, allPropertiesRes, tenanciesRes] = await Promise.all([
                    api.get(`/users/${propData.ownerId}`).catch(() => null),
                    api.get('/properties').catch(() => ({ data: [] })),
                    api.get(`/tenancies/property/${id}`).catch(() => ({ data: [] }))
                ]);

                if (ownerRes) {
                    setOwner(ownerRes.data);
                }
                setTenanciesHistory(tenanciesRes.data || []);

                // Compute owner's total listed properties
                const ownerProps = allPropertiesRes.data.filter(p => p.ownerId === propData.ownerId);
                setOwnerPropertiesCount(ownerProps.length);

                // Compute related properties (same city, excluding current)
                const related = allPropertiesRes.data.filter(
                    p => p.city.toLowerCase() === propData.city.toLowerCase() && p.id !== propData.id && p.status !== 'SOLD' && p.status !== 'RENTED'
                ).slice(0, 3);
                setRelatedProperties(related);
            }
        } catch (err) {
            console.error("Failed to load property details:", err);
            setError("Could not load property details. It may have been removed.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchPropertyData();
    }, [id]);

    useEffect(() => {
        if (property && property.id) {
            let recent = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
            recent = recent.filter(x => x !== property.id);
            recent.unshift(property.id);
            recent = recent.slice(0, 10);
            localStorage.setItem('recently_viewed', JSON.stringify(recent));

            const saved = JSON.parse(localStorage.getItem('saved_properties') || '[]');
            setIsBookmarked(saved.includes(property.id));
        }
    }, [property]);

    const toggleBookmark = () => {
        if (!property) return;
        let saved = JSON.parse(localStorage.getItem('saved_properties') || '[]');
        if (saved.includes(property.id)) {
            saved = saved.filter(x => x !== property.id);
            setIsBookmarked(false);
        } else {
            saved.push(property.id);
            setIsBookmarked(true);
        }
        localStorage.setItem('saved_properties', JSON.stringify(saved));
    };

    const handleContactOwner = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setShowChat(true);
        setTimeout(() => {
            document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleMarkSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (property.purpose === 'RENT') {
                await api.put(`/properties/${property.id}/mark-rented`, {
                    tenantName: markForm.name,
                    tenantContact: markForm.contact,
                    rentAmount: parseFloat(markForm.amount)
                });
            } else {
                if (!markForm.agreementFile) {
                    alert("Please select a sale agreement document.");
                    setIsLoading(false);
                    return;
                }

                await api.put(`/properties/${property.id}/mark-sold`, {
                    buyerName: markForm.name,
                    buyerContact: markForm.contact,
                    soldAmount: parseFloat(markForm.amount)
                });

                const formData = new FormData();
                formData.append('propertyId', property.id);
                formData.append('file', markForm.agreementFile);

                await api.post('/sale-agreements/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            alert(`Property marked as ${property.purpose === 'RENT' ? 'rented' : 'sold'} successfully!`);
            setShowMarkModal(false);
            fetchPropertyData();
        } catch (err) {
            const errorData = err.response?.data;
            const errorMsg = typeof errorData === 'string' ? errorData : (errorData?.message || "Failed to update property status");
            alert(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitiateSaleSubmit = async (e) => {
        e.preventDefault();
        if (!initiateForm.agreementFile) {
            alert("Please select a sale agreement document.");
            return;
        }
        setIsLoading(true);
        try {
            const formData = new FormData();
            if (user.id === property.ownerId) {
                formData.append('buyerDetails', initiateForm.buyerDetails);
            }
            formData.append('file', initiateForm.agreementFile);

            await api.post(`/properties/${property.id}/sale/initiate`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Sale agreement initiated successfully. Waiting for confirmation.');
            setShowInitiateModal(false);
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to initiate sale');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadLeaseSubmit = async (e) => {
        e.preventDefault();
        if (!leaseFile) {
            alert("Please select a lease agreement PDF document.");
            return;
        }
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('propertyId', property.id);
            formData.append('file', leaseFile);
            if (user && user.id !== property.ownerId) {
                formData.append('tenantId', user.id);
            }
            await api.post(`/rentals/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Lease agreement uploaded successfully.');
            setShowLeaseModal(false);
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to upload lease agreement');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyLease = async () => {
        setIsLoading(true);
        try {
            await api.post(`/rentals/${property.id}/verify`);
            alert('Lease verified successfully and property marked as RENTED!');
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to verify lease');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePurchaseRequest = async () => {
        setIsLoading(true);
        try {
            await api.post('/purchase-requests', { propertyId: property.id });
            alert('Purchase request submitted successfully! Once accepted, agreement upload will be enabled.');
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to submit purchase request');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRentalRequest = async () => {
        setIsLoading(true);
        try {
            await api.post('/rental-requests', { propertyId: property.id });
            alert('Rental application request submitted successfully! Once accepted, lease upload will be enabled.');
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to submit rental request');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRentSubmit = async (e) => {
        e.preventDefault();
        if (property.rentalRules && !rulesAccepted) {
            alert("You must accept the rental rules to apply.");
            return;
        }

        setIsLoading(true);
        try {
            await api.post(`/inquiries/${property.id}`, {
                message: rentMessage || "I'm interested in renting this property.",
                acceptedRentalRules: rulesAccepted
            });
            alert('Rental application submitted successfully!');
            setShowRentModal(false);
        } catch (err) {
            alert(err.response?.data || 'Failed to submit rental application');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveSale = async () => {
        setIsLoading(true);
        try {
            await api.put(`/properties/${property.id}/sale/approve`);
            alert('Sale approved successfully!');
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to approve sale');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectSale = async () => {
        setIsLoading(true);
        try {
            await api.put(`/properties/${property.id}/sale/reject`);
            alert('Sale rejected successfully!');
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to reject sale');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTerminateTenancy = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put(`/tenancies/${property.id}/terminate`, { reason: terminateReason });
            alert('Tenancy terminated successfully!');
            setShowTerminateModal(false);
            setTerminateReason('');
            fetchPropertyData();
        } catch (err) {
            alert(err.response?.data || 'Failed to terminate tenancy');
        } finally {
            setIsLoading(false);
        }
    };

    const getLifecycleTimeline = () => {
        const events = [];

        // 1. Created Event
        if (property?.createdAt) {
            events.push({
                title: "Property Listed",
                date: property.createdAt,
                description: "Property was listed on the real estate hub.",
                icon: "📋"
            });
        }

        // 2. Approved Event
        if (property?.status !== 'PENDING') {
            events.push({
                title: "Listing Approved",
                date: property.createdAt,
                description: "Property listing approved by administrator.",
                icon: "✓"
            });
        }

        // 3. Tenancy events
        if (tenanciesHistory && tenanciesHistory.length > 0) {
            tenanciesHistory.forEach((ten) => {
                if (ten.startDate || ten.createdAt) {
                    events.push({
                        title: "Tenancy Started",
                        date: ten.startDate || ten.createdAt,
                        description: `Direct tenancy agreement activated for Tenant ${ten.tenantName} (${ten.tenantPhone}) at ₹${ten.rentAmount ? ten.rentAmount.toLocaleString() : '0'}/mo.`,
                        icon: "🔑"
                    });
                }
                if (ten.status === 'ENDED') {
                    events.push({
                        title: "Tenancy Ended",
                        date: ten.endDate || ten.createdAt,
                        description: `Tenancy terminated by Owner. Reason: "${ten.terminationReason || 'No reason provided'}"`,
                        icon: "🛑"
                    });
                }
            });
        }

        // 4. Online Sale events
        if (property?.saleInitiatedAt) {
            events.push({
                title: "Sale Initiated",
                date: property.saleInitiatedAt,
                description: `Purchase request accepted by Owner. Sale agreement uploaded.`,
                icon: "📄"
            });
        }
        if (property?.saleApprovedAt) {
            events.push({
                title: "Sale Finalized",
                date: property.saleApprovedAt,
                description: `Sale agreement approved and confirmed by Buyer. Property marked as SOLD.`,
                icon: "🤝"
            });
        }

        // Sort events chronologically
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        return events;
    };

    // Parser for technical specifications added to description
    const parseTechnicalSpecs = (desc = '') => {
        const specs = {};
        if (desc.includes('--- Technical Specifications ---')) {
            const parts = desc.split('--- Technical Specifications ---');
            const specList = parts[parts.length - 1].split('|');
            specList.forEach(item => {
                const kv = item.split(':');
                if (kv.length === 2) {
                    specs[kv[0].trim()] = kv[1].trim();
                }
            });
        }
        return specs;
    };

    const cleanDescription = (desc = '') => {
        if (desc.includes('--- Technical Specifications ---')) {
            return desc.split('--- Technical Specifications ---')[0].trim();
        }
        return desc;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'AVAILABLE':
            case 'APPROVED':
                return 'bg-success/10 text-success border-success/30';
            case 'RENTED':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
            case 'SOLD':
                return 'bg-error/10 text-error border-error/30';
            case 'PENDING':
            case 'PENDING_BUYER_CONFIRMATION':
            case 'PENDING_OWNER_CONFIRMATION':
                return 'bg-warning/10 text-warning border-warning/30';
            default:
                return 'bg-gray-800 text-gray-400 border-gray-700';
        }
    };

    if (isLoading && !property) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] px-6">
                <Card className="text-center w-full max-w-lg">
                    <h2 className="text-xl font-serif text-error mb-2">Operation Error</h2>
                    <p className="text-sm text-dark-muted mb-6">{error || "Property listing not found."}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-primary py-2.5 px-6 text-xs cursor-pointer"
                    >
                        Go Back
                    </button>
                </Card>
            </div>
        );
    }

    const techSpecs = parseTechnicalSpecs(property.description);
    const cleanedDesc = cleanDescription(property.description);

    return (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">
            {/* Back button link */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    className="text-brand hover:text-brand-300 font-serif italic text-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                    &larr; Back to listings
                </button>
            </div>

            {/* Split Layout Container */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Side: Images Carousel & Description Details */}
                <div className="flex-1 lg:w-3/5 space-y-8 w-full">
                    {/* Visual Media Gallery carousel */}
                    <Card className="border border-dark-border p-4 relative overflow-hidden">
                        <div className="h-64 md:h-96 w-full rounded-xl overflow-hidden bg-dark border border-dark-border relative flex items-center justify-center">
                            {property.images && property.images.length > 0 ? (
                                <img
                                    src={property.images[activeImageIndex]}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-dark-muted text-sm font-light tracking-widest">[NO IMAGES AVAILABLE]</div>
                            )}

                            {/* Carousel pagination hooks */}
                            {property.images && property.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImageIndex(prev => (prev === 0 ? property.images.length - 1 : prev - 1))}
                                        className="absolute left-4 p-2 bg-dark/75 border border-dark-border rounded-full text-brand hover:bg-brand hover:text-dark-DEFAULT transition-all"
                                    >
                                        &larr;
                                    </button>
                                    <button
                                        onClick={() => setActiveImageIndex(prev => (prev === property.images.length - 1 ? 0 : prev + 1))}
                                        className="absolute right-4 p-2 bg-dark/75 border border-dark-border rounded-full text-brand hover:bg-brand hover:text-dark-DEFAULT transition-all"
                                    >
                                        &rarr;
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails row */}
                        {property.images && property.images.length > 1 && (
                            <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin">
                                {property.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`h-16 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                                            activeImageIndex === idx ? 'border-brand scale-95' : 'border-dark-border opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Overview description */}
                    <Card className="border border-dark-border p-6">
                        <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3 mb-4">Property Overview</h2>
                        <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-wrap">
                            {cleanedDesc || "No overview provided for this property."}
                        </p>
                    </Card>

                    {/* Property Timeline */}
                    <Card className="border border-dark-border p-6 mt-6">
                        <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3 mb-4 gold-gradient-text animate-pulse-slow">Property Lifecycle History</h2>
                        <div className="relative border-l border-dark-border pl-6 ml-3 space-y-6">
                            {getLifecycleTimeline().map((evt, idx) => (
                                <div key={idx} className="relative group">
                                    {/* Timeline dot */}
                                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-dark-border bg-dark group-hover:border-brand transition-all duration-300 flex items-center justify-center text-xs">
                                        <span className="opacity-90">{evt.icon}</span>
                                    </div>
                                    {/* Event detail */}
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-white font-serif tracking-wide">{evt.title}</h3>
                                            <span className="text-[10px] text-dark-muted font-light font-sans tracking-wide">
                                                {new Date(evt.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-light leading-relaxed">{evt.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Neighborhood Pin Map */}
                    {property.latitude && property.longitude && (
                        <Card className="border border-dark-border p-6">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3 mb-4">Pinpoint Neighborhood Location</h2>
                            <div className="w-full h-72 rounded-lg overflow-hidden border border-dark-border">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&hl=en&z=14&output=embed`}
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right Side: Price tags, Specs facts, Owner info */}
                <div className="w-full lg:w-2/5 space-y-6">
                    {/* Pricing, category and Status Badge */}
                    <Card className="border border-dark-border p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-brand tracking-[0.2em] uppercase font-bold bg-brand/5 border border-brand/20 px-3 py-1 rounded">
                                {property.type}
                            </span>
                            <span className={`border px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(property.status)}`}>
                                {property.status === 'APPROVED' || property.status === 'AVAILABLE' ? 'Available' : property.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="flex justify-between items-start gap-4">
                            <h1 className="text-3xl font-serif text-white tracking-wide leading-tight flex-1">
                                {property.title}
                            </h1>
                            <button
                                onClick={toggleBookmark}
                                className="p-2 rounded-full border border-dark-border bg-dark-card hover:border-brand/40 hover:scale-105 transition-all text-brand shrink-0"
                                title={isBookmarked ? "Remove Bookmark" : "Save Listing"}
                            >
                                <svg className={`w-5 h-5 ${isBookmarked ? 'fill-brand text-brand' : 'text-gray-400'}`} fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0Z" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-dark-muted flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {property.city}, {property.state}
                        </p>

                        <div className="text-3xl font-serif text-brand font-bold pt-2 border-t border-dark-border/40">
                            ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                            {property.purpose === 'RENT' && <span className="text-xs text-dark-muted font-sans font-normal tracking-widest ml-1">/ MONTH</span>}
                        </div>
                    </Card>

                    {/* Specifications facts grid */}
                    <Card className="border border-dark-border p-6">
                        <h2 className="text-md font-serif text-white border-b border-dark-border/40 pb-2 mb-4">Listing Specifications</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-dark border border-dark-border rounded-lg text-center">
                                <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider block">Beds count</span>
                                <span className="text-lg font-bold text-white mt-1 block">{property.bedrooms || 0} Bedrooms</span>
                            </div>
                            <div className="p-3 bg-dark border border-dark-border rounded-lg text-center">
                                <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider block">Baths count</span>
                                <span className="text-lg font-bold text-white mt-1 block">{property.bathrooms || 0} Bathrooms</span>
                            </div>
                            {property.squareFootage > 0 && (
                                <div className="p-3 bg-dark border border-dark-border rounded-lg text-center col-span-2">
                                    <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider block">Total Area</span>
                                    <span className="text-lg font-bold text-brand mt-1 block">{property.squareFootage.toLocaleString()} Sq.Ft.</span>
                                </div>
                            )}

                            {/* Dynamically parsed specs */}
                            {Object.keys(techSpecs).map(key => (
                                <div key={key} className="p-3 bg-dark border border-dark-border rounded-lg text-center">
                                    <span className="text-[10px] text-dark-muted uppercase font-bold tracking-wider block">{key}</span>
                                    <span className="text-sm font-semibold text-white mt-1 block">{techSpecs[key]}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Amenities visual tags */}
                    {property.amenities && property.amenities.length > 0 && (
                        <Card className="border border-dark-border p-6">
                            <h2 className="text-md font-serif text-white border-b border-dark-border/40 pb-2 mb-4">Included Amenities</h2>
                            <div className="flex flex-wrap gap-2">
                                {property.amenities.map((item, idx) => (
                                    <span key={idx} className="bg-dark text-gray-300 border border-dark-border px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                                        <span className="h-1.5 h-1.5 bg-brand rounded-full"></span>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Premium Owner Profile card */}
                    <Card className="border border-dark-border p-6 space-y-4">
                        <h2 className="text-md font-serif text-white border-b border-dark-border/40 pb-2">Property Owner</h2>
                        {owner ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-serif text-xl font-bold uppercase">
                                        {owner.name ? owner.name.charAt(0) : 'O'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white tracking-wide text-sm">{owner.name || 'Owner'}</h3>
                                        <p className="text-xs text-dark-muted font-light mt-0.5">Member since {owner.createdAt ? new Date(owner.createdAt).getFullYear() : '2026'}</p>
                                        <p className="text-[10px] text-brand uppercase font-bold tracking-widest mt-1">{ownerPropertiesCount} Properties Listed</p>
                                    </div>
                                </div>

                                {/* Actions row */}
                                {user?.id !== property.ownerId && property.status !== 'RENTED' && property.status !== 'SOLD' && (
                                    <div className="flex flex-col gap-3 pt-2">
                                        <button
                                            onClick={handleContactOwner}
                                            className="btn-primary w-full text-center py-3"
                                        >
                                            Contact Owner
                                        </button>
                                        {(property.status === 'AVAILABLE' || property.status === 'APPROVED') && property.purpose === 'BUY' && (
                                            <button
                                                onClick={handleCreatePurchaseRequest}
                                                className="btn-secondary w-full text-center py-3"
                                            >
                                                Request Purchase
                                            </button>
                                        )}
                                        {(property.status === 'AVAILABLE' || property.status === 'APPROVED') && property.purpose === 'RENT' && (
                                            <button
                                                onClick={handleCreateRentalRequest}
                                                className="btn-secondary w-full text-center py-3"
                                            >
                                                Request Rent
                                            </button>
                                        )}
                                        {property.status === 'SALE_IN_PROGRESS' && property.saleInitiatedBy === user?.id && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded text-xs font-light text-center">
                                                Purchase Request accepted. Waiting for owner to upload sale agreement.
                                            </div>
                                        )}
                                        {property.status === 'RENT_IN_PROGRESS' && property.tenantId === user?.id && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded text-xs font-light text-center">
                                                Rental Request approved. Waiting for owner to upload lease agreement.
                                            </div>
                                        )}
                                        {property.status === 'PENDING_BUYER_CONFIRMATION' && property.saleInitiatedBy === user?.id && (
                                            <div className="space-y-3">
                                                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded text-xs font-light text-center">
                                                    Official Sale Agreement has been uploaded by the Owner. Please review.
                                                </div>
                                                {property.saleDocumentUrl && (
                                                    <a 
                                                        href={`${api.defaults.baseURL || ''}${property.saleDocumentUrl}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="block text-center bg-brand/10 border border-brand/35 text-brand text-xs font-bold py-2 rounded"
                                                    >
                                                        View Sale Agreement Document
                                                    </a>
                                                )}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button onClick={handleApproveSale} className="bg-success text-dark-DEFAULT py-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">Confirm Purchase</button>
                                                    <button onClick={handleRejectSale} className="bg-error text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">Cancel / Reject</button>
                                                </div>
                                            </div>
                                        )}
                                        {property.status === 'PENDING_TENANT_CONFIRMATION' && property.tenantId === user?.id && (
                                            <div className="space-y-3">
                                                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded text-xs font-light text-center">
                                                    Official Lease Agreement has been uploaded by the Owner. Please review.
                                                </div>
                                                <a 
                                                    href={`${api.defaults.baseURL || ''}/api/rentals/${property.id}/document`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="block text-center bg-brand/10 border border-brand/35 text-brand text-xs font-bold py-2 rounded"
                                                >
                                                    View Lease Agreement Document
                                                </a>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button onClick={handleVerifyLease} className="bg-success text-dark-DEFAULT py-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">Confirm Lease</button>
                                                    <button onClick={handleRejectSale} className="bg-error text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer">Cancel / Reject</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Owner specific actions */}
                                {user?.id === property.ownerId && (
                                    <div className="pt-2">
                                        {(property.status === 'AVAILABLE' || property.status === 'APPROVED') && (
                                            <button
                                                onClick={() => setShowMarkModal(true)}
                                                className="btn-primary w-full text-center py-3"
                                            >
                                                {property.purpose === 'RENT' ? 'Mark as Rented' : 'Mark as Sold'}
                                            </button>
                                        )}
                                        {property.status === 'SALE_IN_PROGRESS' && (
                                            <button
                                                onClick={() => setShowInitiateModal(true)}
                                                className="btn-primary w-full text-center py-3"
                                            >
                                                Upload Sale Agreement
                                            </button>
                                        )}
                                        {property.status === 'RENT_IN_PROGRESS' && (
                                            <button
                                                onClick={() => setShowLeaseModal(true)}
                                                className="btn-primary w-full text-center py-3"
                                            >
                                                Upload Lease Agreement
                                            </button>
                                        )}
                                        {property.status === 'PENDING_BUYER_CONFIRMATION' && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded text-xs font-light text-center">
                                                Sale Agreement uploaded. Waiting for buyer confirmation.
                                            </div>
                                        )}
                                        {property.status === 'PENDING_TENANT_CONFIRMATION' && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded text-xs font-light text-center">
                                                Lease Agreement uploaded. Waiting for tenant confirmation.
                                            </div>
                                        )}
                                        {property.status === 'RENTED' && tenanciesHistory.some(t => t.status === 'ACTIVE') && (
                                            <button
                                                onClick={() => setShowTerminateModal(true)}
                                                className="bg-error hover:bg-error/85 text-white w-full text-center py-3 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer mt-3"
                                            >
                                                Terminate Tenancy
                                            </button>
                                        )}
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="text-dark-muted text-xs font-light">Loading owner logs...</div>
                        )}
                    </Card>

                    {/* Active tenant maintenance requests */}
                    {user && user.id === property.tenantId && property.status === 'RENTED' && (
                        <Card className="border border-dark-border p-6">
                            <MaintenanceRequestForm
                                propertyId={property.id}
                                tenantName={user?.username || 'Tenant'}
                                onSuccess={() => { }}
                            />
                        </Card>
                    )}
                </div>
            </div>

            {/* Chat section */}
            {showChat && (
                <div id="chat-section" className="max-w-3xl mx-auto pt-6">
                    <Chat
                        propertyId={property.id}
                        otherUserId={property.ownerId}
                    />
                </div>
            )}

            {/* Related Properties grid */}
            {relatedProperties.length > 0 && (
                <div className="pt-8 border-t border-dark-border/40 space-y-4">
                    <h2 className="text-2xl font-serif text-white tracking-wide">Related Properties in {property.city}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedProperties.map(prop => (
                            <div
                                key={prop.id}
                                onClick={() => navigate(`/property/${prop.id}`)}
                                className="bg-dark-card rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 border border-dark-border hover:border-brand/35 cursor-pointer flex flex-col h-full group"
                            >
                                <div className="h-40 bg-dark relative overflow-hidden">
                                    {prop.images && prop.images.length > 0 ? (
                                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-dark-muted text-xs bg-dark">[NO IMAGES]</div>
                                    )}
                                    <span className="absolute bottom-2 right-2 bg-dark/75 border border-dark-border px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase text-brand tracking-widest">
                                        For {prop.purpose === 'RENT' ? 'Rent' : 'Sale'}
                                    </span>
                                </div>
                                <div className="p-4 flex flex-col flex-1 space-y-2">
                                    <p className="text-lg font-serif text-brand font-bold">₹{prop.price ? prop.price.toLocaleString() : 'N/A'}</p>
                                    <h3 className="text-sm font-medium text-white line-clamp-1 group-hover:text-brand transition-colors font-serif leading-snug">{prop.title}</h3>
                                    <p className="text-xs text-dark-muted">{prop.city}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals structures */}
            {showMarkModal && property && property.purpose === 'RENT' && (
                <MarkPropertyRentedForm
                    propertyId={property.id}
                    ownerId={property.ownerId}
                    onCancel={() => setShowMarkModal(false)}
                    onSuccess={() => {
                        setShowMarkModal(false);
                        alert('Property marked as rented successfully!');
                        fetchPropertyData();
                    }}
                />
            )}

            {showMarkModal && property && property.purpose === 'BUY' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
                        <h2 className="text-xl font-serif text-white mb-4 gold-gradient-text">
                            Mark Property as Sold
                        </h2>
                        <p className="text-sm text-gray-400 mb-6 font-light">
                            Enter the details of the buyer and upload the agreement to finalize this sale.
                        </p>
                        <form onSubmit={handleMarkSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                                    Buyer Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={markForm.name}
                                    onChange={(e) => setMarkForm({ ...markForm, name: e.target.value })}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                                    Buyer Contact <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={markForm.contact}
                                    onChange={(e) => setMarkForm({ ...markForm, contact: e.target.value })}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                    placeholder="Phone/Email"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                                    Sold Amount (₹) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={markForm.amount}
                                    onChange={(e) => setMarkForm({ ...markForm, amount: e.target.value })}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                                    placeholder="Enter final sold price"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                                    Sale Agreement (PDF) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    required
                                    onChange={(e) => setMarkForm({ ...markForm, agreementFile: e.target.files[0] })}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-xs text-dark-muted file:bg-brand file:border-none file:text-dark-DEFAULT file:px-4 file:py-2 file:rounded-md file:cursor-pointer file:mr-4 hover:file:bg-brand-400"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40 mt-6">
                                <button type="button" onClick={() => setShowMarkModal(false)} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold tracking-wider">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs cursor-pointer">Confirm Sale</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showTerminateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
                        <h2 className="text-xl font-serif text-white mb-4 gold-gradient-text">
                            Terminate Tenancy
                        </h2>
                        <p className="text-sm text-gray-400 mb-6 font-light">
                            Are you sure you want to terminate this tenancy? This action will set the property back to available.
                        </p>
                        <form onSubmit={handleTerminateTenancy} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                                    Reason for Termination <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={terminateReason}
                                    onChange={(e) => setTerminateReason(e.target.value)}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
                                    rows="3"
                                    placeholder="e.g. Lease expired, violation of rules, etc."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40 mt-6">
                                <button type="button" onClick={() => { setShowTerminateModal(false); setTerminateReason(''); }} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold tracking-wider">Cancel</button>
                                <button type="submit" className="bg-error hover:bg-error/85 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer">Confirm Termination</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showInitiateModal && property && property.purpose === 'BUY' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
                        <h2 className="text-xl font-serif text-white mb-4">
                            Initiate Sale Agreement
                        </h2>
                        <form onSubmit={handleInitiateSaleSubmit} className="space-y-4">
                            {user.id === property.ownerId && (
                                <div>
                                    <label className="label-luxury">
                                        Buyer Details <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={initiateForm.buyerDetails}
                                        onChange={(e) => setInitiateForm({ ...initiateForm, buyerDetails: e.target.value })}
                                        className="w-full input-luxury resize-none"
                                        rows="3"
                                        placeholder="Buyer Full Name, Contact info..."
                                    />
                                </div>
                            )}
                            <div>
                                <label className="label-luxury">
                                    Official Agreement Document (PDF) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    required
                                    onChange={(e) => setInitiateForm({ ...initiateForm, agreementFile: e.target.files[0] })}
                                    className="w-full input-luxury text-xs text-dark-muted file:bg-brand file:border-none file:text-dark-DEFAULT file:px-4 file:py-2 file:rounded-md file:cursor-pointer file:mr-4 hover:file:bg-brand-400"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40 mt-6">
                                <button type="button" onClick={() => setShowInitiateModal(false)} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold tracking-wider">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs cursor-pointer">Submit Agreement</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRentModal && property && property.purpose === 'RENT' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
                        <h2 className="text-xl font-serif text-white mb-4">
                            Apply for Tenancy
                        </h2>

                        {property.rentalRules && (
                            <div className="mb-4 bg-dark border border-dark-border rounded-lg p-4 max-h-40 overflow-y-auto hidden-scroll">
                                <h3 className="text-xs font-bold text-error mb-2 uppercase tracking-wide">Rental Rules & Conditions</h3>
                                <p className="text-xs text-gray-300 leading-relaxed font-light whitespace-pre-wrap">{property.rentalRules}</p>
                            </div>
                        )}

                        <form onSubmit={handleRentSubmit} className="space-y-4">
                            <div>
                                <label className="label-luxury">
                                    Message to Property Owner <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={rentMessage}
                                    onChange={(e) => setRentMessage(e.target.value)}
                                    className="w-full input-luxury resize-none"
                                    rows="3"
                                    placeholder="Write a message introducing yourself..."
                                />
                            </div>

                            {property.rentalRules && (
                                <label className="flex items-start mt-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={rulesAccepted}
                                        onChange={(e) => setRulesAccepted(e.target.checked)}
                                        className="mt-1 mr-3 h-4 w-4 rounded border-dark-border text-brand focus:ring-brand"
                                        required
                                    />
                                    <span className="text-xs text-gray-300 leading-relaxed font-light">
                                        I accept all rules and lease guidelines listed above.
                                    </span>
                                </label>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40 mt-6">
                                <button type="button" onClick={() => setShowRentModal(false)} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold tracking-wider">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={property.rentalRules && !rulesAccepted}
                                    className="btn-primary py-2 px-6 text-xs cursor-pointer disabled:bg-gray-800 disabled:text-dark-muted disabled:border-gray-700 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showLeaseModal && property && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand"></div>
                        <h2 className="text-xl font-serif text-white mb-4">
                            Upload Lease Agreement
                        </h2>
                        <form onSubmit={handleUploadLeaseSubmit} className="space-y-4">
                            <div>
                                <label className="label-luxury">
                                    Official Lease Document (PDF) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    required
                                    onChange={(e) => setLeaseFile(e.target.files[0])}
                                    className="w-full input-luxury text-xs text-dark-muted file:bg-brand file:border-none file:text-dark-DEFAULT file:px-4 file:py-2 file:rounded-md file:cursor-pointer file:mr-4 hover:file:bg-brand-400"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40 mt-6">
                                <button type="button" onClick={() => setShowLeaseModal(false)} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold tracking-wider">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs cursor-pointer">Submit Lease</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyDetail;
