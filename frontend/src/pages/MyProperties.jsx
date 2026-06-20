import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';

const MyProperties = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [myProperties, setMyProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProperties = async () => {
            setIsLoading(true);
            try {
                const propertiesRes = await api.get('/properties');
                const userProperties = propertiesRes.data.filter(
                    property => property.ownerId === user?.id
                );
                setMyProperties(userProperties);
            } catch (err) {
                console.error("Failed to load listed properties", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) fetchProperties();
    }, [user?.id]);

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1">


                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                    </div>
                ) : myProperties.length === 0 ? (
                    /* Phase 10: Empty State */
                    <div className="bg-dark-card border border-dark-border rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-dark border border-dark-border text-dark-muted rounded-full">
                            <svg className="w-10 h-10 text-dark-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m-14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white text-lg font-serif tracking-wide font-semibold">No Properties Listed</h3>
                            <p className="text-xs text-dark-muted mt-1 max-w-sm mx-auto">You haven't listed any properties for sale or rent on the hub yet.</p>
                        </div>
                        <button
                            onClick={() => navigate('/add-property')}
                            className="btn-primary py-2.5 px-6 text-xs cursor-pointer"
                        >
                            List Your First Property
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myProperties.map((property) => {
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

                            return (
                                <div
                                    key={property.id}
                                    onClick={() => navigate(`/property/${property.id}`)}
                                    className="bg-dark-card rounded-xl overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-all duration-300 border border-dark-border hover:border-brand/35 cursor-pointer flex flex-col h-full group"
                                >
                                    <div className="h-44 bg-[#0B0B0B] relative shrink-0 overflow-hidden border-b border-dark-border">
                                        {property.images && property.images.length > 0 ? (
                                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-dark-muted font-light text-xs bg-dark">
                                                <span className="opacity-40 tracking-widest">[NO IMAGES]</span>
                                            </div>
                                        )}
                                        <span className={`absolute top-3 left-3 border backdrop-blur-md px-2.5 py-1 rounded text-[9px] uppercase font-bold tracking-wider ${getStatusColor(property.status)}`}>
                                            {property.status === 'APPROVED' || property.status === 'AVAILABLE' ? 'Available' : property.status.replace('_', ' ')}
                                        </span>
                                        <span className="absolute bottom-3 right-3 bg-dark/75 border border-dark-border backdrop-blur-md px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase text-brand tracking-widest">
                                            For {property.purpose === 'RENT' ? 'Rent' : 'Sale'}
                                        </span>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1 relative space-y-3">
                                        <p className="text-xl font-serif text-brand font-bold">
                                            ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                                            {property.purpose === 'RENT' && <span className="text-[10px] text-dark-muted font-sans font-normal tracking-wide"> / mo</span>}
                                        </p>
                                        <h3 className="text-md font-medium text-white line-clamp-1 group-hover:text-brand transition-colors font-serif leading-snug">{property.title}</h3>
                                        <p className="text-xs text-dark-muted flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                            {property.city}, {property.state}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyProperties;
