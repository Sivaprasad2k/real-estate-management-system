import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapClickHandler({ setFormData, formData }) {
    useMapEvents({
        click(e) {
            setFormData({
                ...formData,
                latitude: e.latlng.lat,
                longitude: e.latlng.lng
            });
        },
    });
    return null;
}

const AddProperty = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form State matching PropertyRequest.java
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'APARTMENT', // Default PropertyType
        purpose: 'BUY',  // Default PropertyPurpose
        price: '',
        city: '',
        state: '',
        bedrooms: '',
        bathrooms: '',
        squareFootage: '',
        amenities: '', // Will split by comma before sending
        images: '',     // Will split by comma before sending
        latitude: '',
        longitude: '',
        rentalRules: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        // Transform form data to match backend DTO exactly
        const payload = {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            purpose: formData.purpose,
            price: parseFloat(formData.price),
            city: formData.city,
            state: formData.state,
            bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
            bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
            squareFootage: formData.squareFootage ? parseFloat(formData.squareFootage) : 0.0,
            amenities: formData.amenities ? formData.amenities.split(',').map(item => item.trim()).filter(Boolean) : [],
            images: formData.images ? formData.images.split(',').map(item => item.trim()).filter(Boolean) : [],
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            rentalRules: formData.purpose === 'RENT' ? formData.rentalRules : null
        };

        try {
            await api.post('/properties', payload);
            setSuccess(true);

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (err) {
            console.error(err);
            const errorMsg = typeof err.response?.data === 'string'
                ? err.response.data
                : "Failed to create property. Please verify your inputs.";
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1 max-w-4xl mx-auto pb-8">


                <Card>
                    {error && (
                        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                            <span className="block sm:inline">Property listed successfully! Redirecting...</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Details */}
                        <div className="border-b border-dark-border pb-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-200 mb-4">Basic Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="title">Headline Title *</label>
                                    <input id="title" type="text" value={formData.title} onChange={handleChange} required
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white"
                                        placeholder="e.g. Spacious Oceanview Villa" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="purpose">Listing Type *</label>
                                    <select id="purpose" value={formData.purpose} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-dark-card text-black bg-white">
                                        <option value="BUY">For Sale</option>
                                        <option value="RENT">For Rent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="type">Property Type *</label>
                                    <select id="type" value={formData.type} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-dark-card text-black bg-white">
                                        <option value="APARTMENT">Apartment</option>
                                        <option value="HOUSE">House</option>
                                        <option value="VILLA">Villa</option>
                                        <option value="COMMERCIAL">Commercial</option>
                                        <option value="LAND">Land</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="price">Price (₹) *</label>
                                    <input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleChange} required
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white"
                                        placeholder="e.g. 250000" />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="border-b border-dark-border pb-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-200 mb-4">Location</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="city">City *</label>
                                    <input id="city" type="text" value={formData.city} onChange={handleChange} required
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="state">State / Region</label>
                                    <input id="state" type="text" value={formData.state} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="latitude">Latitude (Map Pin Y)</label>
                                    <input id="latitude" type="number" step="any" value={formData.latitude} readOnly
                                        placeholder="Click on the map below"
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 outline-none text-gray-500 bg-gray-100 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="longitude">Longitude (Map Pin X)</label>
                                    <input id="longitude" type="number" step="any" value={formData.longitude} readOnly
                                        placeholder="Click on the map below"
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 outline-none text-gray-500 bg-gray-100 cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Pinpoint Location on Map *</label>
                                <p className="text-xs text-gray-400 mb-3">Click anywhere on the map to set the exact coordinates of the property.</p>
                                <div className="h-64 w-full rounded-lg overflow-hidden border border-dark-border relative z-0">
                                    <MapContainer
                                        center={[20.5937, 78.9629]}
                                        zoom={4}
                                        style={{ height: '100%', width: '100%' }}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; OSM contributors'
                                        />
                                        <MapClickHandler setFormData={setFormData} formData={formData} />
                                        {formData.latitude && formData.longitude && (
                                            <Marker position={[formData.latitude, formData.longitude]} />
                                        )}
                                    </MapContainer>
                                </div>
                            </div>
                        </div>

                        {/* Property Specs */}
                        <div className="border-b border-dark-border pb-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-200 mb-4">Specifications</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['APARTMENT', 'HOUSE', 'VILLA'].includes(formData.type) && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="bedrooms">Bedrooms</label>
                                            <input id="bedrooms" type="number" min="0" value={formData.bedrooms} onChange={handleChange}
                                                className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="bathrooms">Bathrooms</label>
                                            <input id="bathrooms" type="number" min="0" value={formData.bathrooms} onChange={handleChange}
                                                className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white" />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="squareFootage">Square Footage</label>
                                    <input id="squareFootage" type="number" min="0" value={formData.squareFootage} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white" />
                                </div>
                            </div>
                        </div>

                        {/* Extra Details */}
                        <div className="pb-4">
                            <h2 className="text-xl font-semibold text-gray-200 mb-4">Detailed Info</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="description">Full Description</label>
                                    <textarea id="description" rows="4" value={formData.description} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none resize-none text-black bg-white"
                                        placeholder="Describe the property in detail..."></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="amenities">Amenities (Comma separated)</label>
                                    <input id="amenities" type="text" value={formData.amenities} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white"
                                        placeholder="e.g. Pool, Gym, Parking, Balcony" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="images">Image URLs (Comma separated)</label>
                                    <input id="images" type="text" value={formData.images} onChange={handleChange}
                                        className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-black bg-white"
                                        placeholder="https://image1.jpg, https://image2.png" />
                                    <p className="text-xs text-gray-400 mt-1">For now, provide direct URLs to existing images hosted online.</p>
                                </div>

                                {formData.purpose === 'RENT' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="rentalRules">Rental Rules & Requirements</label>
                                        <textarea id="rentalRules" rows="3" value={formData.rentalRules} onChange={handleChange}
                                            className="w-full border border-dark-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 outline-none resize-none text-black bg-white"
                                            placeholder="e.g. No pets allowed. 2 months security deposit required."></textarea>
                                        <p className="text-xs text-gray-400 mt-1">Tenants must accept these rules before they can apply for rent.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t border-dark-border">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="bg-dark-card text-gray-300 border border-dark-border font-medium rounded-lg px-6 py-2.5 mr-4 hover:bg-[#121212] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-brand-600 text-white font-medium rounded-lg px-8 py-2.5 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isLoading ? "Listing Property..." : "Publish Listing"}
                            </button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
};

export default AddProperty;
