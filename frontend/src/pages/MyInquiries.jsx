import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Chat from '../components/Chat';
import api from '../api/axios';
import UserSidebar from '../components/UserSidebar';

const MyInquiries = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
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

            <main className="flex-1 flex flex-col">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse flex-1">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="bg-dark-card border border-dark-border h-20 rounded-xl"></div>
                        ))}
                    </div>
                ) : myInterests.length === 0 ? (
                    <div className="bg-dark-card border border-dark-border rounded-xl p-10 text-center flex flex-col items-center justify-center space-y-4 my-auto">
                        <div className="p-4 bg-dark border border-dark-border text-dark-muted rounded-full">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white text-lg font-serif tracking-wide font-semibold">No Conversation History</h3>
                            <p className="text-xs text-dark-muted mt-1 max-w-sm mx-auto">You have no active chats or property inquiries. Browse listings and contact owners to start a discussion.</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-primary py-2.5 px-6 text-xs cursor-pointer"
                        >
                            Browse Available Properties
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] min-h-[500px] lg:min-h-[600px] border border-dark-border/60 rounded-2xl overflow-hidden bg-dark-card/30 backdrop-blur-md w-full">
                        {/* Left side: Conversation List */}
                        <div className={`w-full lg:w-[380px] shrink-0 border-r border-dark-border bg-dark-card/25 flex flex-col h-full ${activeChat ? 'hidden lg:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-dark-border/40 bg-dark/20">
                                <h2 className="text-base font-serif font-bold text-white tracking-wide">Direct Messages</h2>
                                <p className="text-[10px] text-dark-muted mt-0.5">Real-time negotiations and inquiries</p>
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-dark-border/20 p-2 space-y-1.5 scrollbar-thin">
                                {myInterests.map((inquiry, idx) => {
                                    const isActive = activeChat?.propertyId === inquiry.propertyId && activeChat?.otherUserId === inquiry.otherUserId;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveChat(inquiry)}
                                            className={`p-3.5 rounded-xl cursor-pointer transition-all flex justify-between items-start select-none border relative group ${
                                                isActive 
                                                    ? 'bg-brand/10 border-brand/35 shadow-[0_4px_12px_rgba(212,175,55,0.08)]' 
                                                    : 'bg-transparent border-transparent hover:bg-dark-card/40'
                                            }`}
                                        >
                                            <div className="flex-1 overflow-hidden pr-3">
                                                <h4 className="text-white font-medium text-xs truncate leading-snug">{inquiry.propertyTitle || `Property ID: ${inquiry.propertyId}`}</h4>
                                                <p className="text-[10px] text-brand/85 uppercase tracking-wider font-semibold mt-1">Listed By: {inquiry.otherUserName}</p>
                                                <p className={`text-xs truncate mt-2 leading-relaxed ${inquiry.read ? 'text-dark-muted font-light' : 'text-gray-200 font-medium'}`}>
                                                    {inquiry.lastMessage}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                                                <span className="text-[9px] text-gray-500 block uppercase font-medium tracking-wide">
                                                    {new Date(inquiry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                                {!inquiry.read && <span className="bg-brand text-dark font-bold text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">New</span>}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteConversation(inquiry.propertyId, inquiry.otherUserId);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-dark-muted hover:text-error transition-all p-1 mt-1"
                                                    title="Delete Conversation"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side: Chat Screen container */}
                        <div className={`flex-1 h-full bg-dark/10 flex flex-col ${activeChat ? 'flex' : 'hidden lg:flex'}`}>
                            {activeChat ? (
                                <div className="h-full flex flex-col">
                                    <div className="flex-1 min-h-0">
                                        <Chat
                                            propertyId={activeChat.propertyId}
                                            otherUserId={activeChat.otherUserId}
                                            otherUserName={activeChat.otherUserName}
                                            onBack={() => setActiveChat(null)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#0b0b0b]/40">
                                    <div className="p-5 bg-dark-card border border-dark-border/40 text-brand rounded-full mb-4 shadow-lg animate-pulse-slow">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white text-sm font-serif font-semibold tracking-wide">Select a conversation</h3>
                                    <p className="text-xs text-dark-muted mt-1 max-w-xs leading-relaxed font-light">Choose one of the conversation threads on the left panel to display the active message thread and pricing offers.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyInquiries;
