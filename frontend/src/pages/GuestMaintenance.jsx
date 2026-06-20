import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const MAINTENANCE_SKILLS = ['PLUMBING', 'ELECTRICAL', 'CARPENTRY', 'HVAC', 'GENERAL', 'APPLIANCE'];

const GuestMaintenance = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        propertyId: '',
        tenantCode: '',
        title: '',
        description: '',
        type: 'GENERAL'
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post(`/guest/maintenance?tenantCode=${formData.tenantCode}`, {
                propertyId: formData.propertyId,
                title: formData.title,
                description: formData.description,
                type: formData.type,
                tenantName: 'Guest User' // Backend overrides this with the actual tenant name from DB
            });

            setStatus({
                type: 'success',
                message: 'Your maintenance request has been submitted successfully. Our automated system has assigned a qualified technician and notified the property owner.'
            });

            // Reset form
            setFormData({
                propertyId: '',
                tenantCode: '',
                title: '',
                description: '',
                type: 'GENERAL'
            });

        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data || 'Failed to submit request. Please verify your verification code and Property ID.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
            <div className="bg-dark/40 backdrop-blur-md rounded-xl border border-dark-border p-8 w-full max-w-2xl shadow-2xl animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-white tracking-wide mb-2">Guest Maintenance</h1>
                    <p className="text-gray-400 font-light">Submit a service request using your registered phone number.</p>
                </div>

                {status.message && (
                    <div className={`p-4 rounded-md mb-6 border ${status.type === 'success'
                            ? 'bg-green-900/20 border-green-900/50 text-green-400'
                            : 'bg-red-900/20 border-red-900/50 text-red-400'
                        }`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Property ID</label>
                            <input
                                required
                                type="text"
                                name="propertyId"
                                value={formData.propertyId}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light transition-colors"
                                placeholder="Enter Property ID"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Verification Code</label>
                            <input
                                required
                                type="text"
                                name="tenantCode"
                                value={formData.tenantCode}
                                onChange={handleChange}
                                className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light transition-colors"
                                placeholder="e.g. T-A4B7D2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Issue Type</label>
                        <select
                            required
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white focus:outline-none focus:border-brand-500 font-light transition-colors"
                        >
                            {MAINTENANCE_SKILLS.map(skill => (
                                <option key={skill} value={skill}>{skill}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Issue Title</label>
                        <input
                            required
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light transition-colors"
                            placeholder="Brief description of the problem"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Detailed Description</label>
                        <textarea
                            required
                            rows="4"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-[#111] border border-dark-border rounded-sm px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 font-light transition-colors resize-none"
                            placeholder="Please provide specifics about the issue..."
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex-1 bg-transparent hover:bg-dark-border border border-brand-400 text-brand-400 py-3.5 rounded-sm font-bold tracking-widest uppercase text-[12px] transition-colors"
                        >
                            Back Home
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 bg-brand-400 hover:bg-brand-500 text-dark py-3.5 rounded-sm font-bold tracking-widest uppercase text-[12px] transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GuestMaintenance;
