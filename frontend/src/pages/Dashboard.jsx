import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const response = await api.get('/properties');
                // Filter out properties owned by the current user
                const filteredProperties = response.data.filter(
                    property => property.ownerId !== user?.id
                );
                setProperties(filteredProperties);
            } catch (err) {
                console.error("Failed to fetch properties:", err);
                setError("Could not load properties at this time.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, []);

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            {/* Main Content Pane */}
            <main className="flex-1">


                {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded relative text-sm">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-400"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <Card>
                        <div className="text-center py-10 text-gray-400">
                            No properties are currently available on the market.
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <div
                                key={property.id}
                                onClick={() => navigate(`/property/${property.id}`)}
                                className="bg-dark-card rounded-md shadow-md hover:shadow-xl transition-all duration-300 border border-dark-border cursor-pointer text-left flex flex-col h-full group"
                            >
                                <div className="h-56 bg-[#111] relative shrink-0 overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-light text-sm bg-gradient-to-b from-transparent to-[#111]/50">
                                        <span className="opacity-50 tracking-widest">[IMAGE PLACEHOLDER]</span>
                                    </div>
                                    <span className={`absolute top-4 left-4 px-3 py-1 rounded-sm text-[10px] uppercase font-semibold tracking-wider border backdrop-blur-md ${property.purpose === 'RENT' ? 'bg-brand-400/20 text-brand-300 border-brand-400/30' : 'bg-dark/60 text-gray-300 border-gray-600/50'}`}>
                                        For {property.purpose === 'RENT' ? 'Rent' : 'Sale'}
                                    </span>
                                    {property.propertyStatus !== 'AVAILABLE' && (
                                        <span className="absolute top-4 right-4 bg-red-900/60 text-red-200 border border-red-500/30 backdrop-blur-md px-3 py-1 rounded-sm text-[10px] uppercase font-semibold tracking-wider">
                                            {property.propertyStatus}
                                        </span>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col flex-1 relative">
                                    <p className="text-2xl font-serif text-brand-400 mb-2">
                                        ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                                        {property.purpose === 'RENT' && <span className="text-xs text-gray-500 font-sans tracking-wide"> / mo</span>}
                                    </p>
                                    <h3 className="text-lg font-medium text-white mb-2 line-clamp-1 group-hover:text-brand-300 transition-colors">{property.title}</h3>
                                    <p className="text-xs text-gray-400 mb-4 tracking-wide">{property.city} • {property.bedrooms} Beds • {property.bathrooms} Baths</p>
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-auto font-light leading-relaxed">{property.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
