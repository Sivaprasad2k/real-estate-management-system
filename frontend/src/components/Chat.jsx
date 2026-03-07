import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Chat = ({ propertyId, otherUserId, otherUserName }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [fetchedUserName, setFetchedUserName] = useState('');
    const messagesEndRef = useRef(null);

    const displayName = otherUserName || fetchedUserName || 'User';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!user) return;
        try {
            const response = await api.get(`/chat/${propertyId}/${otherUserId}`);
            setMessages(response.data);
        } catch (err) {
            console.error("Failed to load chat history", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds for new messages
        return () => clearInterval(interval);
    }, [propertyId, otherUserId, user]);

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
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            const payload = {
                receiverId: otherUserId,
                propertyId: propertyId,
                content: newMessage.trim()
            };
            const response = await api.post('/chat', payload);
            setMessages([...messages, response.data]);
            setNewMessage('');

            // Rapid re-fetch to capture the automated bot reply
            setTimeout(fetchMessages, 1200);
        } catch (err) {
            console.error("Failed to send message", err);
            alert("Could not send message. Please try again.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await api.delete(`/chat/${messageId}`);
            setMessages(messages.filter(msg => msg.id !== messageId));
        } catch (err) {
            console.error("Failed to delete message", err);
            alert("Could not delete message. Please try again.");
        }
    };

    if (!user) {
        return <div className="text-gray-400 p-4text-center bg-dark-card rounded-lg border border-dark-border">Please log in to contact the owner.</div>;
    }

    return (
        <div className="flex flex-col h-[500px] bg-dark rounded-xl shadow-lg border border-dark-border overflow-hidden mt-8 relative">
            <div className="bg-dark-card border-b border-dark-border p-3 flex items-center justify-between z-20 shadow-sm relative">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark border border-dark-border flex items-center justify-center text-brand-400 font-bold text-lg">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-white font-semibold text-[16px] leading-tight flex items-center gap-2">
                            {displayName}
                        </h3>
                        <span className="text-xs text-brand-500 font-medium tracking-wide">
                            online
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark relative">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full relative z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="relative z-10 flex justify-center mt-10">
                        <div className="bg-brand-900/20 text-brand-300 border border-brand-500/30 text-xs py-2 px-4 rounded-lg shadow-sm font-medium">
                            Messages are end-to-end encrypted. Send a message to start!
                        </div>
                    </div>
                ) : (
                    <div className="relative z-10 flex flex-col space-y-2">
                        {messages.map((msg, idx) => {
                            const isMine = msg.senderId === user.id;
                            return (
                                <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group w-full`}>
                                    <div className={`max-w-[85%] rounded-lg px-3 pt-2 pb-1.5 shadow-sm relative flex flex-col border ${isMine ? 'bg-brand-900/10 border-brand-500/20 text-gray-200 rounded-tr-sm' : 'bg-dark-card border-dark-border text-gray-300 rounded-tl-sm'}`}>
                                        <div className="flex justify-between items-start gap-4 pr-1">
                                            <p className="text-[15px] break-words leading-snug pb-2 pl-1 pr-1 font-light">{msg.content}</p>

                                            {/* Always show delete icon lightly, brighten on hover */}
                                            {isMine && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="text-gray-500 hover:text-red-400 p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 -mr-1 -mt-1"
                                                    title="Delete message"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-end gap-1 px-1 -mt-2">
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMine && (
                                                <svg className="w-[14px] h-[14px] text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-dark-card border-t border-dark-border flex items-center gap-3 z-10 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-brand-500 transition-colors text-[15px] placeholder-gray-600 font-light"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`rounded-lg px-4 py-2.5 flex items-center justify-center transition-colors font-medium ${newMessage.trim() ? 'bg-brand-500 text-dark hover:bg-brand-400' : 'bg-[#111] border border-dark-border text-gray-600'}`}
                >
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Chat;
