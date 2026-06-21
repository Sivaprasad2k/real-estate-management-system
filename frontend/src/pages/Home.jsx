import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';

const Home = () => {
    const navigate = useNavigate();
    const [maxPrice, setMaxPrice] = useState('');
    const [propertyType, setPropertyType] = useState('');

    return (
        <div className="w-full bg-dark min-h-screen">
            {/* Hero Section */}
            <div className="relative w-full h-screen bg-dark overflow-hidden flex flex-col justify-center -mt-24">
                {/* Background Image with Vignette/Gradient overlay */}
                <div
                    className="absolute inset-0 z-0 bg-dark"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80")',
                        backgroundPosition: 'center',
                        backgroundSize: 'cover'
                    }}
                >
                    {/* Radial dark gradient to mimic the moody vignette in the original image */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(15,15,15,0.85)_100%)] mix-blend-multiply"></div>
                    {/* Linear gradient from bottom for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/40 to-transparent"></div>
                </div>

                {/* Content Container */}
                <div className="relative z-10 w-full max-w-[1400px] mx-auto px-8 md:px-16 flex flex-col justify-center h-full pt-16">

                    {/* Left Section - Small Text */}
                    <div className="absolute left-8 md:left-16 top-[20%] md:top-[25%] uppercase tracking-[0.3em] text-[11px] font-bold text-brand-300 leading-relaxed z-20">
                        <div>Premium</div>
                        <div>Properties</div>
                    </div>
                    {/* Center Section - Giant Typography */}
                    <div className="w-full flex flex-col items-center justify-center pointer-events-none mt-[-2vh] md:mt-[-4vh]">
                        <h1 className="text-white font-serif text-[8vw] md:text-[5.5rem] lg:text-[7.5rem] leading-[0.9] tracking-tight ml-[8%] md:ml-[10%] drop-shadow-2xl">
                            Find Your
                        </h1>
                        <h1 className="text-white font-serif text-[10vw] md:text-[7rem] lg:text-[9.5rem] leading-[0.9] tracking-tight mr-[8%] md:mr-[10%] drop-shadow-2xl">
                            Dream Property.
                        </h1>
                    </div>


                    {/* Search Filter Box */}
                    <div className="absolute bottom-[3%] md:bottom-[6%] left-0 right-0 flex items-center justify-center z-30 px-8 w-full">
                        <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-md flex flex-col md:flex-row gap-5 items-center w-full max-w-5xl shadow-2xl">
                            <div className="w-full">
                                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Location</label>
                                <input
                                    type="text"
                                    placeholder="Enter City..."
                                    className="w-full bg-transparent text-white border-b border-gray-600/50 pb-2 focus:outline-none focus:border-brand-400 text-[13px] font-light tracking-wider placeholder-gray-500"
                                />
                            </div>
                            <div className="w-full">
                                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Max Price</label>
                                <CustomSelect
                                    value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)}
                                    placeholder="Any Price"
                                    options={[
                                        { value: '', label: 'Any Price' },
                                        { value: '500k', label: '₹50,00,000' },
                                        { value: '1m', label: '₹1,00,00,000' },
                                        { value: '5m', label: '₹5,00,00,000' },
                                        { value: '10m', label: '₹10,00,00,000+' }
                                    ]}
                                />
                            </div>
                            <div className="w-full">
                                <label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Property Type</label>
                                <CustomSelect
                                    value={propertyType}
                                    onChange={e => setPropertyType(e.target.value)}
                                    placeholder="All Types"
                                    options={[
                                        { value: '', label: 'All Types' },
                                        { value: 'sale', label: 'For Sale' },
                                        { value: 'rent', label: 'For Rent' }
                                    ]}
                                />
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full md:w-auto bg-brand-400 text-dark px-10 py-3.5 mt-4 md:mt-0 rounded-sm font-bold uppercase tracking-widest text-[12px] hover:bg-brand-500 transition-colors shrink-0"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div id="about" className="w-full bg-dark py-28 border-t border-dark-border relative z-20">
                <div className="max-w-[900px] mx-auto px-8 md:px-16 text-center">
                    <h2 className="text-4xl md:text-5xl font-serif text-brand-400 mb-10 tracking-wide">About Real Estate Hub</h2>
                    <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed mb-10">
                        Real Estate Hub is built to provide a seamless, premium experience for discovering, renting, and purchasing properties. Our platform connects buyers, renters, and property owners in a unified ecosystem designed for efficiency and absolute elegance.
                    </p>
                    <div className="inline-block border border-white/10 bg-white/5 rounded-sm px-6 py-4">
                        <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase leading-loose">
                            Vite Frontend • Tailwind CSS • Spring Boot 3 Backend • MongoDB • JWT Security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
