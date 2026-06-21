import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Chat = ({ propertyId, otherUserId, otherUserName, onBack }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [fetchedUserName, setFetchedUserName] = useState('');
    const messagesEndRef = useRef(null);

    // Refs for typing state synchronization
    const localTypingTimeoutRef = useRef(null);
    const indicatorTimeoutRef = useRef(null);
    const lastTypingSent = useRef(0);

    // Property Header info & Negotiation Actions
    const [property, setProperty] = useState(null);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [visitDate, setVisitDate] = useState('');
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');

    const displayName = otherUserName || fetchedUserName || 'Property Owner';

    const sendTypingStatus = async (status) => {
        if (!user || !propertyId || !otherUserId) return;
        try {
            await api.post('/chat/typing', {
                propertyId,
                receiverId: otherUserId,
                isTyping: status
            });
        } catch (err) {
            // Quietly catch errors
        }
    };

    const handleUserTyping = () => {
        const now = Date.now();
        if (now - lastTypingSent.current > 1500) {
            lastTypingSent.current = now;
            sendTypingStatus(true);
        }

        if (localTypingTimeoutRef.current) {
            clearTimeout(localTypingTimeoutRef.current);
        }

        localTypingTimeoutRef.current = setTimeout(() => {
            sendTypingStatus(false);
        }, 2500);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async (showLoading = false) => {
        if (!user) return;
        if (showLoading) setIsLoading(true);
        try {
            const response = await api.get(`/chat/${propertyId}/${otherUserId}`);
            setMessages(response.data);
        } catch (err) {
            console.error("Failed to load chat history", err);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // Initial fetch and poll
    useEffect(() => {
        fetchMessages(true);
        const interval = setInterval(() => fetchMessages(false), 4000); // Poll for messages
        return () => clearInterval(interval);
    }, [propertyId, otherUserId, user]);

    // Active typing status poller
    useEffect(() => {
        if (!user || !propertyId || !otherUserId) return;

        const checkTypingStatus = async () => {
            try {
                const res = await api.get(`/chat/typing/${propertyId}/${otherUserId}`);
                if (res.data && res.data.isTyping) {
                    setIsTyping(true);

                    // Setup/refresh the 3-second backup timer to auto-hide the typing indicator
                    if (indicatorTimeoutRef.current) {
                        clearTimeout(indicatorTimeoutRef.current);
                    }
                    indicatorTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                    }, 3000);
                } else {
                    setIsTyping(false);
                }
            } catch (err) {
                // Quietly ignore errors
            }
        };

        const interval = setInterval(checkTypingStatus, 2000);
        return () => clearInterval(interval);
    }, [propertyId, otherUserId, user]);

    // Reset local states and clean up on conversation target changes or unmount
    useEffect(() => {
        setIsTyping(false);
        lastTypingSent.current = 0;
        
        if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
        if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);

        return () => {
            if (localTypingTimeoutRef.current) clearTimeout(localTypingTimeoutRef.current);
            if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
            sendTypingStatus(false);
        };
    }, [propertyId, otherUserId]);

    // Fetch property details for header metrics
    useEffect(() => {
        const fetchProperty = async () => {
            if (!propertyId) return;
            try {
                const res = await api.get(`/properties/${propertyId}`);
                setProperty(res.data);
            } catch (err) {
                console.error("Failed to load property in chat header", err);
            }
        };
        fetchProperty();
    }, [propertyId]);

    // Fetch sender/receiver username if missing
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (otherUserName || !otherUserId) return;
            try {
                const res = await api.get(`/users/${otherUserId}`);
                setFetchedUserName(res.data.name);
            } catch (err) {
                console.error("Failed to get other user details", err);
            }
        };
        fetchUserDetails();
    }, [otherUserId, otherUserName]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const typedContent = newMessage.trim();
        setNewMessage('');

        if (localTypingTimeoutRef.current) {
            clearTimeout(localTypingTimeoutRef.current);
        }
        sendTypingStatus(false);

        try {
            const payload = {
                receiverId: otherUserId,
                propertyId: propertyId,
                content: typedContent
            };
            const response = await api.post('/chat', payload);
            setMessages(prev => [...prev, response.data]);
            fetchMessages(false);
        } catch (err) {
            console.error("Failed to send message", err);
            alert("Could not deliver message. Please retry.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Permanently delete this message?")) return;
        try {
            await api.delete(`/chat/${messageId}`);
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (err) {
            console.error("Failed to delete message", err);
            alert("Could not delete message.");
        }
    };

    // Negotiation Triggers
    const handleScheduleVisit = async (e) => {
        e.preventDefault();
        if (!visitDate) return;
        try {
            await api.post('/visits', {
                propertyId,
                visitDate: new Date(visitDate).toISOString()
            });
            const visitMsg = `[SCHEDULED VISIT] I would like to schedule a site visit for ${new Date(visitDate).toLocaleString()}.`;
            const payload = {
                receiverId: otherUserId,
                propertyId,
                content: visitMsg
            };
            const response = await api.post('/chat', payload);
            setMessages(prev => [...prev, response.data]);
            setShowVisitModal(false);
            alert("Visit request scheduled successfully!");
        } catch (err) {
            alert(err.response?.data || "Failed to schedule visit request.");
        }
    };

    const handleMakeOffer = async (e) => {
        e.preventDefault();
        if (!offerAmount) return;
        try {
            const offerMsg = `[OFFER] I would like to make an offer of ₹${parseFloat(offerAmount).toLocaleString()} for this property.`;
            const payload = {
                receiverId: otherUserId,
                propertyId,
                content: offerMsg
            };
            const response = await api.post('/chat', payload);
            setMessages(prev => [...prev, response.data]);
            setShowOfferModal(false);
            setOfferAmount('');
            alert("Offer message sent successfully!");
        } catch (err) {
            alert("Failed to send offer message.");
        }
    };

    const handleSubmitTransactionRequest = async () => {
        if (!property) return;
        try {
            if (property.purpose === 'BUY') {
                await api.post('/purchase-requests', { propertyId });
                const requestMsg = `[PURCHASE REQUEST] I have submitted a formal purchase request for this property. Please review and accept.`;
                const response = await api.post('/chat', {
                    receiverId: otherUserId,
                    propertyId,
                    content: requestMsg
                });
                setMessages(prev => [...prev, response.data]);
                alert("Purchase request submitted successfully!");
            } else {
                await api.post('/rental-requests', { propertyId });
                const requestMsg = `[RENTAL REQUEST] I have submitted a formal rental application request for this property. Please review and accept.`;
                const response = await api.post('/chat', {
                    receiverId: otherUserId,
                    propertyId,
                    content: requestMsg
                });
                setMessages(prev => [...prev, response.data]);
                alert("Rental application request submitted successfully!");
            }
        } catch (err) {
            alert(err.response?.data || "Failed to submit request.");
        }
    };

    if (!user) {
        return (
            <div className="text-center p-8 bg-dark-card rounded-xl border border-dark-border text-dark-muted font-light text-sm">
                Log in to contact listing owners and discuss negotiations.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0b0b0b]/60 backdrop-blur-md rounded-2xl shadow-2xl border border-dark-border overflow-hidden relative">
            {/* Header bar */}
            <div className="bg-dark-card border-b border-dark-border p-3 md:p-4 flex items-center justify-between z-20 relative">
                <div className="flex items-center gap-2 md:gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="lg:hidden text-brand hover:text-brand-300 mr-1 md:mr-2 p-1 cursor-pointer transition-colors"
                            aria-label="Back to conversations"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                    )}
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand/10 border border-brand/20 text-brand flex items-center justify-center font-serif text-base md:text-lg font-bold">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold text-xs md:text-sm tracking-wide">{displayName}</h3>
                        <span className="text-[9px] md:text-[10px] text-success font-bold tracking-widest uppercase flex items-center gap-1 md:gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                            Direct Contact
                        </span>
                    </div>
                </div>
            </div>

            {/* Property details header and action triggers */}
            {property && (
                <div className="bg-[#12141a] border-b border-dark-border px-3 py-2 md:px-4 md:py-2.5 flex items-center justify-between text-xs z-15 relative">
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1 mr-2">
                        <span className="text-white font-semibold font-serif truncate max-w-[100px] sm:max-w-[150px] text-[11px] md:text-xs">{property.title}</span>
                        <span className="text-brand font-bold shrink-0 text-[11px] md:text-xs">₹{property.price?.toLocaleString()}</span>
                    </div>
                    {user && user.id !== property.ownerId && property.status !== 'SOLD' && property.status !== 'RENTED' && (
                        <div className="flex gap-1 md:gap-1.5 shrink-0">
                            <button onClick={() => setShowVisitModal(true)} className="px-2 py-1 md:px-2.5 md:py-1.5 bg-dark border border-dark-border hover:border-brand/40 text-white rounded text-[9px] md:text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer">Visit</button>
                            <button onClick={() => setShowOfferModal(true)} className="px-2 py-1 md:px-2.5 md:py-1.5 bg-dark border border-dark-border hover:border-brand/40 text-white rounded text-[9px] md:text-[10px] uppercase font-bold tracking-wider transition-all cursor-pointer">Offer</button>
                            <button onClick={handleSubmitTransactionRequest} className="px-2 py-1 md:px-2.5 md:py-1.5 bg-brand text-dark-DEFAULT rounded text-[9px] md:text-[10px] uppercase font-bold tracking-wider transition-all hover:bg-brand-400 cursor-pointer">
                                {property.purpose === 'BUY' ? 'Buy' : 'Apply'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4 bg-[#0B0B0B]/20 relative scrollbar-thin">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                        <div className="p-3 bg-dark border border-dark-border rounded-full text-dark-muted">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-1.922 4.613a1.275 1.275 0 00.1.927c.242.384.66.623 1.11.623h9.056c.45 0 .868-.24 1.11-.623a1.275 1.275 0 00.1-.927l-1.921-4.613A1.275 1.275 0 0015.316 10H8.684a1.275 1.275 0 00-1.184.742z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-white text-sm font-semibold tracking-wide">No Messages Yet</h4>
                            <p className="text-[11px] text-dark-muted max-w-xs mx-auto">Send an inquiry to initiate negotiations regarding pricing, agreements, or site visits.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-2 md:space-y-3">
                        {messages.map((msg, idx) => {
                            const isMine = msg.senderId === user.id;
                            return (
                                <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} w-full animate-fade-in`}>
                                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 md:px-4 md:py-2.5 shadow-md flex flex-col border transition-all relative group ${
                                        isMine
                                            ? 'bg-brand/10 border-brand/30 text-white rounded-tr-none'
                                            : 'bg-dark-card border-dark-border text-gray-300 rounded-tl-none'
                                    }`}>
                                        <div className="flex justify-between items-start gap-3">
                                            <p className="text-xs font-light leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                            {isMine && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="text-dark-muted hover:text-error transition-colors shrink-0 opacity-0 group-hover:opacity-100 p-0.5"
                                                    title="Delete message"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-end gap-1.5 mt-1.5 border-t border-white/[0.03] pt-1 text-[9px] text-dark-muted select-none">
                                            <span>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMine && (
                                                <svg className="w-3.5 h-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7m-4 0l-4 4-4-4" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
 
                {/* Animated Typing Indicator */}
                {isTyping && (
                    <div className="flex justify-start w-full animate-pulse">
                        <div className="flex items-center gap-1.5 bg-dark-card border border-dark-border rounded-2xl px-3 py-2 md:px-4 md:py-3 max-w-[200px] shadow-sm rounded-tl-none">
                            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            <span className="text-[9px] text-dark-muted uppercase font-bold tracking-widest ml-2">Typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
 
            {/* Message Input controls */}
            <form onSubmit={handleSendMessage} className="p-2.5 md:p-4 bg-dark-card border-t border-dark-border flex items-center gap-2 md:gap-3 z-20 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleUserTyping();
                    }}
                    placeholder="Type a message to initiate visit or negotiation..."
                    className="flex-1 bg-[#0B0B0B] border border-dark-border rounded-xl px-3.5 py-2.5 md:px-4 md:py-3 text-white focus:border-brand outline-none text-xs transition-colors placeholder-dark-muted font-light"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${
                        newMessage.trim()
                            ? 'bg-brand text-dark-DEFAULT hover:bg-brand-400 hover:shadow-[0_4px_12px_rgba(212,175,55,0.25)]'
                            : 'bg-dark border border-dark-border text-dark-muted cursor-not-allowed'
                    }`}
                >
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>

            {/* Visit Modal */}
            {showVisitModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-fade-in">
                        <h3 className="text-lg font-serif text-white mb-4">Schedule Site Visit</h3>
                        <form onSubmit={handleScheduleVisit} className="space-y-4">
                            <div>
                                <label className="label-luxury">Preferred Visit Date & Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={visitDate}
                                    onChange={(e) => setVisitDate(e.target.value)}
                                    className="w-full input-luxury"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40">
                                <button type="button" onClick={() => setShowVisitModal(false)} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs cursor-pointer">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Offer Modal */}
            {showOfferModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-fade-in">
                        <h3 className="text-lg font-serif text-white mb-4">Make an Offer</h3>
                        <form onSubmit={handleMakeOffer} className="space-y-4">
                            <div>
                                <label className="label-luxury">Your Offered Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    value={offerAmount}
                                    onChange={(e) => setOfferAmount(e.target.value)}
                                    className="w-full input-luxury"
                                    placeholder="e.g. 14500000"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-border/40">
                                <button type="button" onClick={() => setShowOfferModal(false)} className="px-4 py-2 text-dark-muted hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs cursor-pointer">Send Offer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
