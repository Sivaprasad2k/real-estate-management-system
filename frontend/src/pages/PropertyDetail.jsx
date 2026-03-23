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
    const [property, setProperty] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [markForm, setMarkForm] = useState({ name: '', contact: '', amount: '', agreementFile: null });
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    const [initiateForm, setInitiateForm] = useState({ buyerDetails: '', agreementFile: null });
    const [showRentModal, setShowRentModal] = useState(false);
    const [rentMessage, setRentMessage] = useState('');
    const [rulesAccepted, setRulesAccepted] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await api.get(`/properties/${id}`);
                setProperty(response.data);
            } catch (err) {
                console.error("Failed to fetch property details:", err);
                setError("Could not load property details. It may have been removed.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const handleContactOwner = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setShowChat(true);
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    const handleAction = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        const action = property.purpose === 'RENT' ? 'rental application' : 'purchase offer';
        alert(`Your ${action} for ${property.title} has been submitted successfully! The owner will review your request.`);
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
            const response = await api.get(`/properties/${id}`);
            setProperty(response.data);
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
            alert('Sale initiated successfully. Waiting for other party confirmation.');
            setShowInitiateModal(false);
            const response = await api.get(`/properties/${id}`);
            setProperty(response.data);
        } catch (err) {
            alert(err.response?.data || 'Failed to initiate sale');
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
            const response = await api.get(`/properties/${id}`);
            setProperty(response.data);
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
            const response = await api.get(`/properties/${id}`);
            setProperty(response.data);
        } catch (err) {
            alert(err.response?.data || 'Failed to reject sale');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-400"></div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] px-6">
                <Card className="text-center w-full max-w-lg">
                    <h2 className="text-xl font-semibold text-red-500 mb-2">Error</h2>
                    <p className="text-gray-400 mb-6">{error || "Property not found."}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-brand-600 text-white font-medium rounded-lg px-6 py-2 hover:bg-brand-700 transition-colors"
                    >
                        Go Back
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <button
                onClick={() => navigate(-1)}
                className="text-brand-400 font-serif italic text-lg hover:text-brand-300 mb-8 flex items-center gap-2 transition-colors"
            >
                &larr; Back to listings
            </button>

            <div className="bg-dark/40 backdrop-blur-sm rounded-md shadow-2xl border border-dark-border overflow-hidden md:flex">
                {/* Image Section */}
                <div className="md:w-1/2 h-80 md:h-auto relative bg-gray-900 flex shrink-0 justify-center items-center overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                        <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-gray-500 text-lg font-light tracking-widest">[NO IMAGES AVAILABLE]</div>
                    )}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider shadow-md backdrop-blur-md border ${property.purpose === 'RENT' ? 'bg-brand-400/20 text-brand-300 border-brand-400/30' : 'bg-dark/60 text-gray-300 border-gray-600/50'}`}>
                        For {property.purpose === 'RENT' ? 'Rent' : 'Sale'}
                    </div>
                    {property.status && property.status !== 'APPROVED' && (
                        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {property.status}
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-3">
                        <span className="text-brand-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                            {property.type}
                        </span>
                    </div>

                    <h1 className="text-4xl font-serif text-white mb-4 leading-tight tracking-wide">
                        {property.title}
                    </h1>

                    <p className="text-gray-400 mb-8 flex items-center gap-2 text-sm font-light tracking-wide">
                        <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {property.city}, {property.state}
                    </p>

                    <div className="text-4xl font-serif text-brand-400 mb-8">
                        ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                        {property.purpose === 'RENT' && <span className="text-sm text-gray-500 font-sans tracking-widest font-light ml-2">/ MONTH</span>}
                    </div>

                    <div className="flex gap-6 mb-8 border-y border-dark-border py-4">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white">{property.bedrooms || 0}</span>
                            <span className="text-xs text-gray-400 uppercase tracking-widest text-center">Beds</span>
                        </div>
                        <div className="w-px bg-dark-border"></div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white">{property.bathrooms || 0}</span>
                            <span className="text-xs text-gray-400 uppercase tracking-widest text-center">Baths</span>
                        </div>
                        {property.squareFootage > 0 && (
                            <>
                                <div className="w-px bg-dark-border"></div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-white">{property.squareFootage.toLocaleString()}</span>
                                    <span className="text-xs text-gray-400 uppercase tracking-widest text-center">SqFt</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mb-auto">
                        <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-300 leading-relaxed text-sm">
                            {property.description || "No description provided."}
                        </p>
                    </div>

                    {property.amenities && property.amenities.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                                {property.amenities.map((item, idx) => (
                                    <span key={idx} className="bg-dark px-3 py-1 rounded-md text-xs text-gray-300 border border-dark-border">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Map Section */}
                    {property.latitude && property.longitude && (
                        <div className="mt-8">
                            <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Location Map</h3>
                            <div className="w-full h-64 rounded-md overflow-hidden border border-dark-border">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&hl=en&z=14&output=embed`}
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {user?.id !== property.ownerId && property.status !== 'RENTED' && property.status !== 'SOLD' && (
                        <div className="mt-10 pt-8 border-t border-dark-border flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleContactOwner}
                                className="flex-1 bg-brand-400 hover:bg-brand-500 text-dark font-medium py-3.5 px-6 rounded-sm shadow-md transition-colors text-center text-[13px] tracking-widest uppercase"
                            >
                                Contact Owner
                            </button>
                            {property.purpose === 'BUY' && property.status === 'AVAILABLE' && (
                                <button
                                    onClick={() => setShowInitiateModal(true)}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3.5 px-6 rounded-sm shadow-md transition-colors text-center text-[13px] tracking-widest uppercase"
                                >
                                    Initiate Purchase
                                </button>
                            )}
                            {property.purpose === 'RENT' && property.status === 'AVAILABLE' && (
                                <button
                                    onClick={() => {
                                        setRentMessage(`I am interested in renting ${property.title}.`);
                                        setRulesAccepted(false);
                                        setShowRentModal(true);
                                    }}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3.5 px-6 rounded-sm shadow-md transition-colors text-center text-[13px] tracking-widest uppercase"
                                >
                                    Apply for Rent
                                </button>
                            )}
                            {property.status === 'PENDING_BUYER_CONFIRMATION' && (
                                <div className="flex gap-4 w-full">
                                    <button onClick={handleApproveSale} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3.5 px-6 rounded-sm uppercase tracking-widest text-[13px]">Approve Sale</button>
                                    <button onClick={handleRejectSale} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 px-6 rounded-sm uppercase tracking-widest text-[13px]">Reject Sale</button>
                                </div>
                            )}
                        </div>
                    )}
                    {user?.id !== property.ownerId && property.status === 'RENTED' && (
                        <div className="mt-8 pt-6 border-t border-dark-border">
                            <MaintenanceRequestForm
                                propertyId={property.id}
                                tenantName={user?.username || 'Tenant'}
                                onSuccess={() => { }}
                            />
                        </div>
                    )}
                    {user?.id === property.ownerId && property.status === 'APPROVED' && property.purpose === 'RENT' && (
                        <div className="mt-10 pt-8 border-t border-dark-border flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowMarkModal(true)}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-dark font-medium py-3.5 px-6 rounded-sm shadow-md transition-colors text-center text-[13px] tracking-widest uppercase"
                            >
                                Mark as Rented
                            </button>
                        </div>
                    )}
                    {user?.id === property.ownerId && (property.status === 'APPROVED' || property.status === 'AVAILABLE') && property.purpose === 'BUY' && (
                        <div className="mt-10 pt-8 border-t border-dark-border flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowInitiateModal(true)}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-dark font-medium py-3.5 px-6 rounded-sm shadow-md transition-colors text-center text-[13px] tracking-widest uppercase"
                            >
                                Initiate Sale
                            </button>
                        </div>
                    )}
                    {user?.id === property.ownerId && property.status === 'PENDING_OWNER_CONFIRMATION' && (
                        <div className="mt-10 pt-8 border-t border-dark-border flex gap-4 w-full">
                            <button onClick={handleApproveSale} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3.5 px-6 rounded-sm uppercase tracking-widest text-[13px]">Approve Sale</button>
                            <button onClick={handleRejectSale} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 px-6 rounded-sm uppercase tracking-widest text-[13px]">Reject Sale</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Overlay/Section */}
            {showChat && (
                <div id="chat-section" className="mt-8 max-w-2xl mx-auto animate-fade-in">
                    <Chat
                        propertyId={property.id}
                        otherUserId={property.ownerId}
                    />
                </div>
            )}

            {/* Mark Sold/Rented Modal */}
            {showMarkModal && property && (
                property.purpose === 'RENT' ? (
                    <MarkPropertyRentedForm
                        propertyId={property.id}
                        ownerId={property.ownerId}
                        onCancel={() => setShowMarkModal(false)}
                        onSuccess={async () => {
                            setShowMarkModal(false);
                            alert('Property marked as rented successfully!');
                            setIsLoading(true);
                            try {
                                const response = await api.get(`/properties/${id}`);
                                setProperty(response.data);
                            } catch (err) {
                                console.error("Error updating property state", err);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    />
                ) : null
            )}

            {/* Initiate Sale Modal */}
            {showInitiateModal && property && property.purpose === 'BUY' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Initiate Sale Verification
                        </h2>
                        <form onSubmit={handleInitiateSaleSubmit} className="space-y-4">
                            {user.id === property.ownerId && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-300 mb-1 tracking-wider">
                                        Buyer Details <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        required
                                        value={initiateForm.buyerDetails}
                                        onChange={(e) => setInitiateForm({ ...initiateForm, buyerDetails: e.target.value })}
                                        className="w-full bg-dark border border-dark-border rounded-md px-3 py-2 text-white"
                                        placeholder="Name, Contact, Agreement terms..."
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 tracking-wider">
                                    Sale Document (PDF) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    required
                                    onChange={(e) => setInitiateForm({ ...initiateForm, agreementFile: e.target.files[0] })}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2 text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowInitiateModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-500 text-dark rounded-md">Submit Document</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rent Application Modal */}
            {showRentModal && property && property.purpose === 'RENT' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Apply for Rent
                        </h2>

                        {property.rentalRules && (
                            <div className="mb-4 bg-gray-900 border border-dark-border rounded-md p-4 max-h-40 overflow-y-auto">
                                <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">Rental Rules & Requirements</h3>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{property.rentalRules}</p>
                            </div>
                        )}

                        <form onSubmit={handleRentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1 tracking-wider">
                                    Message to Owner <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={rentMessage}
                                    onChange={(e) => setRentMessage(e.target.value)}
                                    className="w-full bg-dark border border-dark-border rounded-md px-3 py-2 text-white"
                                    rows="3"
                                />
                            </div>

                            {property.rentalRules && (
                                <div className="flex items-start mt-2">
                                    <input
                                        type="checkbox"
                                        id="acceptRules"
                                        checked={rulesAccepted}
                                        onChange={(e) => setRulesAccepted(e.target.checked)}
                                        className="mt-1 mr-2"
                                        required
                                    />
                                    <label htmlFor="acceptRules" className="text-sm text-gray-300">
                                        I have read and accept all the rental rules and requirements.
                                    </label>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => setShowRentModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={property.rentalRules && !rulesAccepted}
                                    className="px-4 py-2 bg-brand-500 text-dark rounded-md disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    Submit Application
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PropertyDetail;
