import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Chat from '../components/Chat';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';

const MyInquiries = () => {
    const { user } = useAuth();
    const [myInterests, setMyInterests] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchInbox = async () => {
            setIsLoading(true);
            try {
                const inboxRes = await api.get('/chat/inbox');
                setMyInterests(inboxRes.data);
            } catch (err) {
                console.error("Failed to load inquiries", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) fetchInbox();
    }, [user?.id]);

    const handleDeleteConversation = async (propertyId, otherUserId) => {
        if (!window.confirm("Are you sure you want to permanently delete this entire conversation?")) return;
        try {
            await api.delete(`/chat/conversation/${propertyId}/${otherUserId}`);
            setMyInterests(prev => prev.filter(c => !(c.propertyId === propertyId && c.otherUserId === otherUserId)));
            if (activeChat && activeChat.propertyId === propertyId && activeChat.otherUserId === otherUserId) {
                setActiveChat(null);
            }
        } catch (err) {
            console.error("Failed to delete conversation", err);
            alert("Could not delete conversation.");
        }
    };

    return (
        <div className="flex gap-8 min-h-[calc(100vh-8rem)]">
            <UserSidebar />

            <main className="flex-1">


                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {myInterests.length === 0 ? (
                            <Card>
                                <p className="text-gray-400 py-4">You have no active chats or inquiries.</p>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {myInterests.map((inquiry, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setActiveChat(inquiry)}
                                        className={`bg-dark-card border rounded-lg p-5 flex justify-between items-start cursor-pointer transition-colors relative group ${activeChat?.propertyId === inquiry.propertyId && activeChat?.otherUserId === inquiry.otherUserId ? 'border-brand-500 bg-[#121212]' : 'border-dark-border hover:bg-dark'}`}
                                    >
                                        <div className="flex-1 overflow-hidden pr-4">
                                            <h3 className="text-white font-medium truncate mb-1">{inquiry.propertyTitle || `Property ID: ${inquiry.propertyId}`}</h3>
                                            <p className="text-xs text-brand-400 mb-2 tracking-wide uppercase font-semibold">Chatting with: {inquiry.otherUserName}</p>
                                            <p className={`text-sm truncate ${inquiry.read ? 'text-gray-400' : 'text-gray-100 font-medium'}`}>
                                                {inquiry.lastMessage}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                                            <span className="text-[10px] text-gray-500 block uppercase font-semibold tracking-wider">
                                                {new Date(inquiry.timestamp).toLocaleDateString()}
                                            </span>
                                            {!inquiry.read && <span className="bg-brand-500 text-dark font-bold tracking-wide text-[10px] px-2 py-0.5 rounded-sm uppercase">New</span>}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteConversation(inquiry.propertyId, inquiry.otherUserId);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-[#8696a0] hover:text-red-400 mt-2 transition-opacity z-10 p-1"
                                                title="Delete Conversation"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeChat && (
                            <div className="mt-8 animate-fade-in flex flex-col items-center bg-dark-card border border-dark-border rounded-xl p-6 hidden-scroll">
                                <div className="w-full flex justify-between items-center mb-6 border-b border-dark-border pb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white">{activeChat.propertyTitle || 'Listing'}</h3>
                                        <p className="text-sm text-gray-400 mt-1">Chatting with <span className="text-brand-400 font-medium">{activeChat.otherUserName}</span></p>
                                    </div>
                                    <button
                                        onClick={() => setActiveChat(null)}
                                        className="text-gray-500 hover:text-white transition-colors p-2"
                                        title="Close Chat"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <div className="w-full h-[500px]">
                                    <Chat
                                        propertyId={activeChat.propertyId}
                                        otherUserId={activeChat.otherUserId}
                                        otherUserName={activeChat.otherUserName}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyInquiries;
