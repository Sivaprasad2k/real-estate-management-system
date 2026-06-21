import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';
import CustomSelect from '../components/CustomSelect';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to dynamically pan/zoom leaflet map
function MapViewCenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] && center[1]) {
            map.setView(center, 12);
        }
    }, [center, map]);
    return null;
}

// Click listener to place marker
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

const AddProperty = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Dynamic Leaflet Map Center (defaults to center of India)
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
    const [mapSearch, setMapSearch] = useState('');
    const [isSearchingMap, setIsSearchingMap] = useState(false);

    // Form Wizard State variables
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
        amenities: [], // String array
        images: [],     // Base64 string array
        latitude: '',
        longitude: '',
        rentalRules: '',

        // Extra dynamic specs
        propertyAge: '',
        parkingCount: '',
        furnishingStatus: 'Unfurnished',
        ownershipType: 'Freehold',
        availabilityDate: '',
        floor: '',
        balcony: 'No',
        furnishing: 'Unfurnished',
        parking: 'No',
        garden: 'No',
        roadAccess: 'No',
        floors: '',
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleCheckboxChange = (amenity) => {
        setFormData(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
    };

    // Geocoding lookup using OSM Nominatim API
    const handleLocationLookup = async () => {
        if (!mapSearch.trim()) return;
        setIsSearchingMap(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&countrycodes=in`);
            const data = await res.json();
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                setMapCenter([lat, lon]);
            } else {
                alert("Location search found no matches in India. Try another city or address.");
            }
        } catch (err) {
            console.error("Geocoding service error:", err);
        } finally {
            setIsSearchingMap(false);
        }
    };

    // Handle map click markers positioning
    const handleMapMarkerClick = (lat, lng) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    // Client-side image resize and JPEG compression pipeline
    const compressAndAddImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(compressedBase64);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // Drag and drop events
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleFileDrop = async (e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        await processUploadedFiles(files);
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        await processUploadedFiles(files);
    };

    const processUploadedFiles = async (files) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        for (const file of imageFiles) {
            try {
                const base64 = await compressAndAddImage(file);
                setFormData(prev => ({ ...prev, images: [...prev.images, base64] }));
            } catch (err) {
                console.error("Failed to compress image file", err);
            }
        }
    };

    // Reorder base64 list items
    const moveImage = (index, direction) => {
        setFormData(prev => {
            const images = [...prev.images];
            const targetIndex = index + direction;
            if (targetIndex >= 0 && targetIndex < images.length) {
                const temp = images[index];
                images[index] = images[targetIndex];
                images[targetIndex] = temp;
            }
            return { ...prev, images };
        });
    };

    const deleteImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, idx) => idx !== index)
        }));
    };

    // Submit listings
    const submitListing = async (statusOverride = null) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        // Format dynamic specifications and append to description
        let formattedDesc = formData.description;
        const specDetails = [];
        if (formData.type === 'APARTMENT') {
            specDetails.push(`Floor: ${formData.floor || 'N/A'}`, `Balcony: ${formData.balcony}`, `Furnishing: ${formData.furnishing}`);
        } else if (formData.type === 'VILLA') {
            specDetails.push(`Parking: ${formData.parking}`, `Garden: ${formData.garden}`);
        } else if (formData.type === 'LAND') {
            specDetails.push(`Plot Area: ${formData.squareFootage ? formData.squareFootage + ' SqFt' : 'N/A'}`, `Road Access: ${formData.roadAccess}`);
        } else if (formData.type === 'COMMERCIAL') {
            specDetails.push(`Office Area: ${formData.squareFootage ? formData.squareFootage + ' SqFt' : 'N/A'}`, `Parking: ${formData.parking}`, `Floors: ${formData.floors || 'N/A'}`);
        }

        if (specDetails.length > 0) {
            formattedDesc += `\n\n--- Technical Specifications ---\n${specDetails.join(' | ')}`;
        }

        const payload = {
            title: formData.title,
            description: formattedDesc,
            type: formData.type,
            purpose: formData.purpose,
            price: parseFloat(formData.price),
            city: formData.city,
            state: formData.state,
            bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
            bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
            squareFootage: formData.squareFootage ? parseFloat(formData.squareFootage) : 0.0,
            amenities: formData.amenities,
            images: formData.images,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            rentalRules: formData.purpose === 'RENT' ? formData.rentalRules : null,
            propertyAge: formData.propertyAge ? parseInt(formData.propertyAge) : null,
            parkingCount: formData.parkingCount ? parseInt(formData.parkingCount) : null,
            furnishingStatus: formData.furnishingStatus || null,
            ownershipType: formData.ownershipType || null,
            availabilityDate: formData.availabilityDate ? formData.availabilityDate + ":00" : null
        };

        try {
            await api.post('/properties', payload);
            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1800);
        } catch (err) {
            console.error("Listing failed", err);
            setError(err.response?.data || "Failed to publish property listing. Check inputs.");
        } finally {
            setIsLoading(false);
        }
    };

    const validateStep = () => {
        if (currentStep === 1) {
            if (!formData.title || !formData.price || !formData.description) {
                alert("Please fill out the title, price, and description details.");
                return false;
            }
        }
        if (currentStep === 2) {
            if (!formData.city || !formData.state) {
                alert("Please fill out the city and state fields.");
                return false;
            }
            if (!formData.latitude || !formData.longitude) {
                alert("Please click on the Leaflet map to pin coordinate locations.");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 7));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const availableAmenities = [
        'Parking', 'Lift', 'CCTV', 'Security', 'Power Backup', 'Swimming Pool', 'Gym', 'Garden', 'Balcony'
    ];

    const steps = [
        { num: 1, label: 'Basics' },
        { num: 2, label: 'Location' },
        { num: 3, label: 'Specs' },
        { num: 4, label: 'Amenities' },
        { num: 5, label: 'Images' },
        { num: 6, label: 'Preview' },
        { num: 7, label: 'Publish' }
    ];

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1 max-w-4xl mx-auto pb-8 space-y-8">
                {/* Stepper Progress bar */}
                <div className="border-b border-dark-border pb-6">
                    <h1 className="text-3xl font-serif text-white tracking-wide">
                        Create <span className="gold-gradient-text font-semibold">Luxury Property Listing</span>
                    </h1>
                    <p className="text-xs text-dark-muted mt-2">Follow our 7-step wizard pipeline to list your property on the hub.</p>

                    {/* Progress indicators */}
                    <div className="relative mt-8">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-dark-border"></div>
                        </div>
                        <div className="relative flex justify-between">
                            {steps.map(s => (
                                <button
                                    key={s.num}
                                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                                    disabled={s.num >= currentStep}
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                        currentStep === s.num
                                            ? 'bg-brand text-dark-DEFAULT ring-4 ring-brand-500/20'
                                            : currentStep > s.num
                                            ? 'bg-brand/20 text-brand border border-brand/40'
                                            : 'bg-dark-card text-dark-muted border border-dark-border'
                                    }`}
                                >
                                    {s.num}
                                </button>
                            ))}
                        </div>
                        <div className="hidden sm:flex justify-between text-[10px] text-dark-muted uppercase font-bold tracking-wider mt-3">
                            {steps.map(s => (
                                <span key={s.num} className={currentStep === s.num ? 'text-brand' : ''}>{s.label}</span>
                            ))}
                        </div>
                        <div className="flex sm:hidden justify-center text-[10px] text-brand uppercase font-bold tracking-wider mt-3">
                            Step {currentStep} of 7: {steps[currentStep - 1].label}
                        </div>
                    </div>
                </div>

                <Card className="border border-dark-border relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand via-brand-400 to-brand rounded-t-xl"></div>

                    {error && (
                        <div className="mb-6 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg text-sm">
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg text-sm">
                            <span>Property listing generated successfully! Redirecting back to operations...</span>
                        </div>
                    )}

                    {/* STEP 1: Property Basics */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3">Step 1: Property Basics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="label-luxury" htmlFor="title">Headline Title *</label>
                                    <input id="title" type="text" value={formData.title} onChange={handleInputChange} required
                                        className="w-full input-luxury" placeholder="e.g. Majestic Oceanfront Villa in Goa" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="label-luxury" htmlFor="purpose">Listing Type *</label>
                                    <CustomSelect
                                        id="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'BUY', label: 'For Sale' },
                                            { value: 'RENT', label: 'For Rent' }
                                        ]}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="label-luxury" htmlFor="type">Property Category *</label>
                                    <CustomSelect
                                        id="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'APARTMENT', label: 'Apartment' },
                                            { value: 'HOUSE', label: 'House' },
                                            { value: 'VILLA', label: 'Villa' },
                                            { value: 'COMMERCIAL', label: 'Commercial' },
                                            { value: 'SHOP', label: 'Shop' },
                                            { value: 'LAND', label: 'Land' }
                                        ]}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="label-luxury" htmlFor="price">
                                        {formData.purpose === 'RENT' ? 'Rental Amount (₹) *' : 'Transaction Amount (₹) *'}
                                    </label>
                                    <input id="price" type="number" value={formData.price} onChange={handleInputChange} required
                                        className="w-full input-luxury" placeholder={formData.purpose === 'RENT' ? 'e.g. 25000' : 'e.g. 15000000'} />
                                </div>
                            </div>
                            <div>
                                <label className="label-luxury" htmlFor="description">Full Overview *</label>
                                <textarea id="description" rows="5" value={formData.description} onChange={handleInputChange} required
                                    className="w-full input-luxury resize-none" placeholder="Provide detailed characteristics of the layout..."></textarea>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Location Map selection */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3">Step 2: Location</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label-luxury" htmlFor="city">City *</label>
                                    <input id="city" type="text" value={formData.city} onChange={handleInputChange} required
                                        className="w-full input-luxury" placeholder="e.g. Mumbai" />
                                </div>
                                <div>
                                    <label className="label-luxury" htmlFor="state">State / Region *</label>
                                    <input id="state" type="text" value={formData.state} onChange={handleInputChange} required
                                        className="w-full input-luxury" placeholder="e.g. Maharashtra" />
                                </div>
                            </div>

                            {/* Geocoder Search box */}
                            <div className="space-y-2">
                                <label className="label-luxury">Search Address or Landmark in India</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={mapSearch}
                                        onChange={e => setMapSearch(e.target.value)}
                                        placeholder="e.g. Bandra West, Mumbai"
                                        className="flex-1 input-luxury"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleLocationLookup}
                                        disabled={isSearchingMap}
                                        className="btn-secondary py-2.5 px-6 font-bold text-xs whitespace-nowrap cursor-pointer"
                                    >
                                        {isSearchingMap ? 'Searching...' : 'Locate on Map'}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="label-luxury">Map Coordinates * (Placed Marker)</label>
                                <p className="text-[10px] text-dark-muted">Click directly on the leaflet map below to set the precise coords.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" readOnly value={formData.latitude} placeholder="Latitude" className="input-luxury cursor-not-allowed opacity-75" />
                                    <input type="number" readOnly value={formData.longitude} placeholder="Longitude" className="input-luxury cursor-not-allowed opacity-75" />
                                </div>
                            </div>

                            <div className="h-72 w-full rounded-xl overflow-hidden border border-dark-border relative z-0">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={4}
                                    style={{ height: '100%', width: '100%' }}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap'
                                    />
                                    <MapClickHandler onMapClick={handleMapMarkerClick} />
                                    <MapViewCenter center={mapCenter} />
                                    {formData.latitude && formData.longitude && (
                                        <Marker position={[formData.latitude, formData.longitude]} />
                                    )}
                                </MapContainer>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Dynamic Property Specs */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3">Step 3: Specifications</h2>

                            {/* Common inputs for bedrooms/bathrooms/squareFootage if not Land */}
                            {formData.type !== 'LAND' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <label className="label-luxury" htmlFor="bedrooms">Bedrooms Count</label>
                                        <input id="bedrooms" type="number" min="0" value={formData.bedrooms} onChange={handleInputChange}
                                            className="w-full input-luxury" placeholder="e.g. 3" />
                                    </div>
                                    <div>
                                        <label className="label-luxury" htmlFor="bathrooms">Bathrooms Count</label>
                                        <input id="bathrooms" type="number" min="0" value={formData.bathrooms} onChange={handleInputChange}
                                            className="w-full input-luxury" placeholder="e.g. 3" />
                                    </div>
                                    <div>
                                        <label className="label-luxury" htmlFor="squareFootage">Total Area (SqFt)</label>
                                        <input id="squareFootage" type="number" min="0" value={formData.squareFootage} onChange={handleInputChange}
                                            className="w-full input-luxury" placeholder="e.g. 2500" />
                                    </div>
                                </div>
                            )}

                            {formData.type === 'LAND' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="label-luxury" htmlFor="squareFootage">Plot Area (SqFt)</label>
                                        <input id="squareFootage" type="number" min="0" value={formData.squareFootage} onChange={handleInputChange}
                                            className="w-full input-luxury" placeholder="e.g. 5000" />
                                    </div>
                                    <div>
                                        <label className="label-luxury" htmlFor="roadAccess">Direct Road Access?</label>
                                        <CustomSelect
                                            id="roadAccess"
                                            value={formData.roadAccess}
                                            onChange={handleInputChange}
                                            options={[
                                                { value: 'Yes', label: 'Yes' },
                                                { value: 'No', label: 'No' }
                                            ]}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Conditional Specifications by Schema */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-t border-dark-border/30 pt-6">
                                {formData.type !== 'LAND' && (
                                    <>
                                        <div>
                                            <label className="label-luxury" htmlFor="propertyAge">Property Age (Years)</label>
                                            <input id="propertyAge" type="number" min="0" value={formData.propertyAge} onChange={handleInputChange}
                                                className="w-full input-luxury" placeholder="e.g. 5" />
                                        </div>
                                        <div>
                                            <label className="label-luxury" htmlFor="parkingCount">Parking Count (Slots)</label>
                                            <input id="parkingCount" type="number" min="0" value={formData.parkingCount} onChange={handleInputChange}
                                                className="w-full input-luxury" placeholder="e.g. 2" />
                                        </div>
                                        <div>
                                            <label className="label-luxury" htmlFor="furnishingStatus">Furnishing Status</label>
                                            <CustomSelect
                                                id="furnishingStatus"
                                                value={formData.furnishingStatus}
                                                onChange={handleInputChange}
                                                options={[
                                                    { value: 'Unfurnished', label: 'Unfurnished' },
                                                    { value: 'Semi-Furnished', label: 'Semi-Furnished' },
                                                    { value: 'Fully Furnished', label: 'Fully Furnished' }
                                                ]}
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="label-luxury" htmlFor="ownershipType">Ownership Type</label>
                                    <CustomSelect
                                        id="ownershipType"
                                        value={formData.ownershipType}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'Freehold', label: 'Freehold' },
                                            { value: 'Leasehold', label: 'Leasehold' },
                                            { value: 'Cooperative', label: 'Cooperative' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="label-luxury" htmlFor="availabilityDate">Availability Date</label>
                                    <input id="availabilityDate" type="datetime-local" value={formData.availabilityDate} onChange={handleInputChange}
                                        className="w-full input-luxury" />
                                </div>
                            </div>

                            {/* Rental rules input */}
                            {formData.purpose === 'RENT' && (
                                <div className="mt-4">
                                    <label className="label-luxury" htmlFor="rentalRules">Rental Rules / Guidelines</label>
                                    <textarea id="rentalRules" rows="3" value={formData.rentalRules} onChange={handleInputChange}
                                        className="w-full input-luxury resize-none" placeholder="e.g. Bachelor tenants welcome. 3 months security deposit required."></textarea>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: Checkboxes Amenities */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3">Step 4: Amenities</h2>
                            <p className="text-xs text-dark-muted mb-4">Select all internal/external features of the property.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {availableAmenities.map(amenity => {
                                    const isChecked = formData.amenities.includes(amenity);
                                    return (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => handleCheckboxChange(amenity)}
                                            className={`p-4 rounded-xl border text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-between group cursor-pointer ${
                                                isChecked
                                                    ? 'bg-brand/10 border-brand text-brand'
                                                    : 'bg-dark border-dark-border text-dark-muted hover:border-gray-500'
                                            }`}
                                        >
                                            <span>{amenity}</span>
                                            <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ml-4 ${
                                                isChecked ? 'border-brand bg-brand' : 'border-dark-border'
                                            }`}>
                                                {isChecked && (
                                                    <svg className="w-2.5 h-2.5 text-dark-DEFAULT" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Images drag and drop upload */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3">Step 5: Media Gallery</h2>
                            <p className="text-xs text-dark-muted mb-4">Drag and drop file structures or upload images directly. Files are optimized automatically.</p>

                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleFileDrop}
                                className="border-2 border-dashed border-dark-border rounded-xl p-8 text-center bg-dark hover:border-brand/40 transition-colors cursor-pointer relative"
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="space-y-2 flex flex-col items-center">
                                    <div className="p-3 bg-[#151515] border border-dark-border rounded-full text-brand">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                    </div>
                                    <h4 className="text-sm font-semibold text-white">Drag and Drop Media Files Here</h4>
                                    <p className="text-xs text-dark-muted">Or click to select files from directory (Supports JPG, PNG, WebP)</p>
                                </div>
                            </div>

                            {/* Image previews and reordering lists */}
                            {formData.images.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Previews & Reordering ({formData.images.length} uploaded)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {formData.images.map((imgBase64, idx) => (
                                            <div key={idx} className="bg-dark border border-dark-border rounded-lg p-2 flex flex-col relative group">
                                                <div className="h-28 rounded overflow-hidden relative bg-[#0B0B0B]">
                                                    <img src={imgBase64} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteImage(idx)}
                                                        className="absolute top-1 right-1 bg-red-900/80 text-red-200 border border-red-500/30 p-1.5 rounded-full hover:bg-red-800 transition-colors"
                                                        title="Delete image"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>

                                                <div className="flex justify-between mt-2 pt-2 border-t border-dark-border/40 text-[10px]">
                                                    <button
                                                        type="button"
                                                        disabled={idx === 0}
                                                        onClick={() => moveImage(idx, -1)}
                                                        className="text-brand hover:text-brand-300 disabled:text-dark-muted cursor-pointer font-bold tracking-wider"
                                                    >
                                                        &larr; Prev
                                                    </button>
                                                    <span className="text-dark-muted">Index {idx + 1}</span>
                                                    <button
                                                        type="button"
                                                        disabled={idx === formData.images.length - 1}
                                                        onClick={() => moveImage(idx, 1)}
                                                        className="text-brand hover:text-brand-300 disabled:text-dark-muted cursor-pointer font-bold tracking-wider"
                                                    >
                                                        Next &rarr;
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 6: Preview Listing */}
                    {currentStep === 6 && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-xl font-serif text-white border-b border-dark-border/40 pb-3">Step 6: Preview Listing</h2>
                            <p className="text-xs text-dark-muted mb-4">Review how the property card is rendered in lists before final publish.</p>

                            <div className="max-w-md mx-auto">
                                <div className="bg-dark-card rounded-xl overflow-hidden border border-brand/40 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col h-full">
                                    <div className="h-56 bg-[#0B0B0B] relative shrink-0 overflow-hidden border-b border-dark-border">
                                        {formData.images.length > 0 ? (
                                            <img src={formData.images[0]} alt="Preview Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-dark-muted font-light text-xs bg-dark">
                                                <span className="opacity-40 tracking-widest">[NO IMAGES UPLOADED]</span>
                                            </div>
                                        )}
                                        <span className="absolute top-3 left-3 bg-success/10 text-success border border-success/30 backdrop-blur-md px-2.5 py-1 rounded text-[9px] uppercase font-bold tracking-wider">
                                            Available
                                        </span>
                                        <span className="absolute bottom-3 right-3 bg-dark/75 border border-dark-border backdrop-blur-md px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase text-brand tracking-widest">
                                            For {formData.purpose === 'RENT' ? 'Rent' : 'Sale'}
                                        </span>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1 space-y-3">
                                        <p className="text-xl font-serif text-brand font-bold">
                                            ₹{formData.price ? parseFloat(formData.price).toLocaleString() : 'N/A'}
                                            {formData.purpose === 'RENT' && <span className="text-[10px] text-dark-muted font-sans font-normal tracking-wide"> / mo</span>}
                                        </p>
                                        <h3 className="text-md font-medium text-white line-clamp-1 font-serif leading-snug">{formData.title || 'Untitled Property'}</h3>
                                        <p className="text-xs text-dark-muted flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                            {formData.city || 'City'}, {formData.state || 'State'}
                                        </p>

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 7: Publish Submission details */}
                    {currentStep === 7 && (
                        <div className="space-y-6 animate-fade-in text-center py-8">
                            <h2 className="text-2xl font-serif text-white">Step 7: Ready to Publish</h2>
                            <p className="text-sm text-dark-muted max-w-md mx-auto leading-relaxed">Your luxury property listing details are fully compiled. Submit now to register the property directory updates.</p>

                            <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl max-w-sm mx-auto text-left space-y-2.5">
                                <p className="text-xs text-white"><span className="font-bold uppercase text-brand tracking-wider mr-2">Title:</span> {formData.title}</p>
                                <p className="text-xs text-white"><span className="font-bold uppercase text-brand tracking-wider mr-2">Category:</span> {formData.type}</p>
                                <p className="text-xs text-white"><span className="font-bold uppercase text-brand tracking-wider mr-2">Amount:</span> ₹{parseFloat(formData.price).toLocaleString()}</p>
                                <p className="text-xs text-white"><span className="font-bold uppercase text-brand tracking-wider mr-2">Images:</span> {formData.images.length} files optimized</p>
                            </div>
                        </div>
                    )}

                    {/* Wizard controls footer */}
                    <div className="flex justify-between pt-6 border-t border-dark-border mt-8">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="bg-transparent border border-dark-border text-dark-muted font-medium rounded-lg px-6 py-2.5 hover:bg-dark-card transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        >
                            &larr; Back
                        </button>

                        <div className="flex gap-4">
                            {currentStep < 7 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn-primary py-2.5 px-6 font-bold cursor-pointer"
                                >
                                    Next Step &rarr;
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => submitListing('DRAFT')}
                                        disabled={isLoading}
                                        className="btn-secondary py-2.5 px-6 font-bold cursor-pointer"
                                    >
                                        Save Draft
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => submitListing()}
                                        disabled={isLoading}
                                        className="btn-primary py-2.5 px-6 font-bold cursor-pointer"
                                    >
                                        {isLoading ? 'Publishing...' : 'Publish Listing'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default AddProperty;
