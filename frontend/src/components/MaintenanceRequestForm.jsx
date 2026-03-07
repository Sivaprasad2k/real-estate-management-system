import React, { useState } from 'react';
import api from '../api/axios';

const MaintenanceRequestForm = ({ propertyId, tenantName, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'GENERAL'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await api.post(`/maintenance/${propertyId}`, {
                title: formData.title,
                description: formData.description,
                type: formData.type
            });
            setFormData({ title: '', description: '', type: 'GENERAL' });
            if (onSuccess) onSuccess();
            alert("Maintenance request submitted successfully.");
        } catch (err) {
            console.error("Failed to submit maintenance request", err);
            setError(err.response?.data || "An error occurred while submitting your request.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-6 shadow-md w-full max-w-lg">
            <h3 className="text-xl font-semibold text-white mb-2 gold-gradient-text">Submit Maintenance Request</h3>
            <p className="text-sm text-gray-400 mb-6 font-light">Describe the issue you're experiencing with the property.</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                        Issue Title
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="e.g. Leaky Faucet in Kitchen"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                        Maintenance Type
                    </label>
                    <select
                        required
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                    >
                        <option value="GENERAL">General Maintenance</option>
                        <option value="PLUMBING">Plumbing</option>
                        <option value="ELECTRICAL">Electrical</option>
                        <option value="HVAC">HVAC / AC</option>
                        <option value="APPLIANCE">Appliance Repair</option>
                        <option value="CARPENTRY">Carpentry</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                        Issue Description
                    </label>
                    <textarea
                        required
                        rows="4"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                        placeholder="Please provide details about the issue..."
                    />
                </div>
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-500 hover:bg-brand-400 text-dark font-medium py-3 rounded-md shadow transition-colors text-sm disabled:opacity-50"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaintenanceRequestForm;
