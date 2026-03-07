import React, { useState } from 'react';
import api from '../api/axios';

const MarkPropertyRentedForm = ({ propertyId, ownerId, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({
        tenantName: '',
        tenantPhone: '',
        rentAmount: '',
        startDate: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await api.post('/tenancies', {
                propertyId,
                ownerId,
                tenantName: formData.tenantName,
                tenantPhone: formData.tenantPhone,
                rentAmount: parseFloat(formData.rentAmount),
                startDate: formData.startDate ? `${formData.startDate}T00:00:00` : null
            });
            onSuccess();
        } catch (err) {
            console.error("Failed to mark property rented", err);
            const errorData = err.response?.data;
            const errorMsg = typeof errorData === 'string' ? errorData : (errorData?.message || "Failed to save tenancy record.");
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <h2 className="text-xl font-semibold text-white mb-4 gold-gradient-text">
                    Mark as Rented
                </h2>
                <p className="text-sm text-gray-400 mb-6 font-light">
                    Enter the details of the tenant to finalize this rental assignment.
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                            Tenant Name
                        </label>
                        <input
                            type="text"
                            name="tenantName"
                            required
                            value={formData.tenantName}
                            onChange={handleChange}
                            className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                            Tenant Phone
                        </label>
                        <input
                            type="text"
                            name="tenantPhone"
                            required
                            value={formData.tenantPhone}
                            onChange={handleChange}
                            className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                            placeholder="Phone Number"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                            Monthly Rent (₹)
                        </label>
                        <input
                            type="number"
                            name="rentAmount"
                            required
                            min="0"
                            value={formData.rentAmount}
                            onChange={handleChange}
                            className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors"
                            placeholder="Enter amount"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1 uppercase tracking-wider">
                            Start Date
                        </label>
                        <input
                            type="date"
                            name="startDate"
                            required
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full bg-dark border border-dark-border rounded-md px-3 py-2.5 text-gray-300 focus:outline-none focus:border-brand-500 transition-colors [&::-webkit-calendar-picker-indicator]:filter-invert"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-md text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-md bg-brand-500 hover:bg-brand-400 text-dark font-medium transition-colors text-sm disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Confirm & Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarkPropertyRentedForm;
