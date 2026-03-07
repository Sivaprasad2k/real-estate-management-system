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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    </div>
                ) : myProperties.length === 0 ? (
                    <Card>
                        <p className="text-gray-400 py-4">You haven't listed any properties for sale or rent yet.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myProperties.map((property) => (
                            <div
                                key={property.id}
                                onClick={() => navigate(`/property/${property.id}`)}
                                className="bg-dark-card rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-dark-border cursor-pointer flex flex-col h-full"
                            >
                                <div className="h-40 bg-[#111] relative shrink-0">
                                    {property.images && property.images.length > 0 ? (
                                        <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                                            <span>[No Image]</span>
                                        </div>
                                    )}
                                    <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-sm text-[10px] font-bold shadow-sm uppercase tracking-wider backdrop-blur-md ${property.purpose === 'RENT' ? 'bg-brand-400/20 text-brand-300 border border-brand-400/30' : 'bg-dark/80 text-gray-200 border border-dark-border'}`}>
                                        For {property.purpose === 'RENT' ? 'Rent' : 'Sale'}
                                    </span>
                                    {property.status && property.status !== 'APPROVED' && (
                                        <span className="absolute top-2 right-2 bg-red-900/60 text-red-200 border border-red-500/30 backdrop-blur-md px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase">
                                            {property.status}
                                        </span>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                    <p className="text-xl font-serif text-brand-400 mb-1">
                                        ₹{property.price ? property.price.toLocaleString() : 'N/A'}
                                        {property.purpose === 'RENT' && <span className="text-xs text-gray-500 font-sans tracking-wide"> / mo</span>}
                                    </p>
                                    <h3 className="text-md font-medium text-white mb-2 line-clamp-1">{property.title}</h3>
                                    <p className="text-xs text-gray-400">{property.city} • {property.bedrooms} Beds</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyProperties;
