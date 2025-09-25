import React, { useState, useEffect, useRef } from 'react';
import { getAiResponse, getTitleForChat } from './services/geminiService';
import type { Message, Chat } from './types';
import LoadingScreen from './components/LoadingScreen';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import { CognitoLogo, CognitoLogoText } from './components/Logo';
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons';

const App: React.FC = () => {
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = chats.find(c => c.id === activeChatId);

    // Load from localStorage on initial render
    useEffect(() => {
        const savedChats = localStorage.getItem('cognito-chats');
        if (savedChats) {
            setChats(JSON.parse(savedChats));
        }
         const timer = setTimeout(() => setIsAppLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    // Save to localStorage whenever chats change
    useEffect(() => {
        if (chats.length > 0) {
            localStorage.setItem('cognito-chats', JSON.stringify(chats));
        }
    }, [chats]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);

    const handleSendMessage = async (content: string) => {
        let targetChatId = activeChatId;
        let isNewChat = false;

        if (!targetChatId) {
            isNewChat = true;
            const newChat: Chat = { id: Date.now().toString(), title: "New Chat", messages: [] };
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(newChat.id);
            targetChatId = newChat.id;
        }

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
        setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: [...c.messages, userMessage] } : c));

        setIsAiLoading(true);

        const currentHistory = chats.find(c => c.id === targetChatId)?.messages || [];

        try {
            const aiResponse = await getAiResponse(currentHistory, content);
            const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', content: aiResponse };
            
            const updatedMessages = [...currentHistory, userMessage, modelMessage];
            
            setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: updatedMessages } : c));
            
            if (isNewChat) {
                const newTitle = await getTitleForChat(updatedMessages);
                setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, title: newTitle } : c));
            }

        } catch (error) {
            const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', content: "Something went wrong. Please check your connection or API key." };
            setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, messages: [...c.messages, errorMessage] } : c));
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setIsSidebarOpen(false);
    };

    const handleSelectChat = (id: string) => {
        setActiveChatId(id);
        setIsSidebarOpen(false);
    };
    
    const handleRenameChat = (id: string, newTitle: string) => {
        setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    };

    const handleDeleteChat = (id: string) => {
        setChats(prev => prev.filter(c => c.id !== id));
        if (activeChatId === id) {
            setActiveChatId(null);
        }
    };


    if (isAppLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="bg-background min-h-screen flex text-white overflow-hidden">
            <Sidebar 
                chats={chats}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onRenameChat={handleRenameChat}
                onDeleteChat={handleDeleteChat}
                isSidebarOpen={isSidebarOpen}
            />
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
            <div className="flex-1 flex flex-col relative">
                <header className="flex items-center p-4 border-b border-card-border md:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-primary tracking-wider mx-auto">{activeChat?.title || 'COGNITO'}</h1>
                </header>
                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                        <CognitoLogo className="h-96 w-96" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="max-w-3xl mx-auto space-y-6">
                        {!activeChat ? (
                            <div className="flex flex-col items-center justify-center h-full pt-20">
                                <CognitoLogoText />
                            </div>
                        ) : (
                            <>
                                {activeChat.messages.map((msg, index) => (
                                    <div key={msg.id} style={{ animationDelay: `${index * 100}ms` }} className="fade-in-up">
                                        <MessageComponent message={msg} />
                                    </div>
                                ))}
                                {isAiLoading && activeChatId === activeChat.id && (
                                    <div className="fade-in-up">
                                        <MessageComponent message={{id: 'loading', role: 'model', content: '...'}}/>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                        </div>
                    </div>
                    <ChatInput 
                        onSendMessage={handleSendMessage} 
                        isLoading={isAiLoading} 
                        showSuggestions={!activeChat || activeChat.messages.length === 0}
                    />
                </main>
            </div>
        </div>
    );
};

export default App;
