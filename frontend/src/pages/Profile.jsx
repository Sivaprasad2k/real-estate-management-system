import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Profile = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        phoneNumber: '',
        address: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
            setFormData({
                phoneNumber: response.data.phoneNumber || '',
                address: response.data.address || ''
            });
        } catch (err) {
            console.error("Failed to load profile", err);
            setMessage({ type: 'error', text: 'Error loading profile data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setMessage({ type: '', text: '' });
            const response = await api.put('/users/me', formData);
            setProfile(response.data);
            setIsEditing(false);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Loading profile...</div>;
    }

    if (!profile) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-6">
                <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                <Card className="bg-dark-card border border-dark-border text-white p-8 mt-8">
                    {message.text ? (
                        <div className="px-4 py-3 rounded bg-red-900 border border-red-700 text-red-200">
                            {message.text}
                        </div>
                    ) : (
                        <div className="text-gray-400">Failed to load profile data.</div>
                    )}
                </Card>
            </div>
        );
    }

    const formattedDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="max-w-3xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400 mb-8">Manage your account details and contact information.</p>

            <Card className="bg-dark-card border border-dark-border text-white p-8">
                {message.text && (
                    <div className={`mb-6 px-4 py-3 rounded ${message.type === 'success' ? 'bg-green-900 border border-green-700 text-green-200' : 'bg-red-900 border border-red-700 text-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Read-only Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-dark-border">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Full Name</label>
                            <p className="mt-1 text-lg font-semibold">{profile.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Gmail Address</label>
                            <p className="mt-1 text-lg font-semibold">{profile.email}</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400">Member Since</label>
                            <p className="mt-1 text-md text-brand-400 font-medium">{formattedDate}</p>
                        </div>
                    </div>

                    {/* Editable Data */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Contact Information</h2>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm font-medium text-brand-500 hover:text-brand-400"
                                >
                                    Edit Details
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({ phoneNumber: profile.phoneNumber || '', address: profile.address || '' }); // reset
                                    }}
                                    className="text-sm font-medium text-gray-400 hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        className="w-full bg-[#121212] border border-dark-border rounded-lg px-4 py-2 focus:border-brand-600 outline-none text-black bg-white"
                                        placeholder="e.g. +1 (555) 123-4567"
                                    />
                                ) : (
                                    <p className="mt-1 text-md">{profile.phoneNumber || <span className="text-gray-500 italic">Not provided</span>}</p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Mailing Address</label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-[#121212] border border-dark-border rounded-lg px-4 py-2 focus:border-brand-600 outline-none resize-none text-black bg-white"
                                        rows="3"
                                        placeholder="Enter your full mailing address"
                                    ></textarea>
                                ) : (
                                    <p className="mt-1 text-md whitespace-pre-line">{profile.address || <span className="text-gray-500 italic">Not provided</span>}</p>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-dark-border/40 flex justify-between items-center mt-8">
                        <span className="text-xs text-gray-500">Need to sign out?</span>
                        <button
                            onClick={logout}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-bold tracking-widest uppercase px-6 py-2.5 rounded-lg transition-all duration-300 cursor-pointer"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Profile;
