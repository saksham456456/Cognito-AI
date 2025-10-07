

import React, { useState, useEffect, useRef } from 'react';
import { getAiResponse, getTitleForChat } from './services/geminiService';
import { saveChat, loadChats, deleteChat, deleteAllChats } from './services/dbService';
import type { Message, Chat } from './types';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import { CognitoLogo } from './components/Logo';
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons';
import ProfileModal from './components/ProfileModal';
import LoadingScreen from './components/LoadingScreen';
import AboutModal from './components/AboutModal';
import ConfirmationModal from './components/ConfirmationModal';

const App: React.FC = () => {
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Guest User');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);
    const [isDbLoading, setIsDbLoading] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const chatsRef = useRef(chats);
    chatsRef.current = chats;

    const activeChat = chats.find(c => c.id === activeChatId);

    useEffect(() => {
        const init = async () => {
            try {
                const startTime = Date.now();
                const loadedChats = await loadChats();
                setChats(loadedChats);
                if (loadedChats.length > 0) {
                    setActiveChatId(loadedChats[0].id);
                }
                const elapsedTime = Date.now() - startTime;
                const minLoadingTime = 1500; // 1.5 seconds
                if (elapsedTime < minLoadingTime) {
                    await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
                }
            } catch (error) {
                console.error("Failed to load chats from database:", error);
            } finally {
                setIsDbLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('userName', userName);
    }, [userName]);

    useEffect(() => {
        if (!activeChat || isDbLoading) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            const chatToSave = chatsRef.current.find(c => c.id === activeChat.id);
            if (chatToSave) {
                saveChat(chatToSave).catch(error => console.error("Failed to save chat:", error));
            }
        }, 500);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [activeChat?.messages, activeChat?.title, isDbLoading]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);

    const handleSendMessage = async (content: string) => {
        let currentChatId = activeChatId;
        let history: Message[] = [];
        let isNewChat = false;
        
        if (!currentChatId) {
            isNewChat = true;
            const newChatId = Date.now().toString();
            const newChat: Chat = { id: newChatId, title: "New Conversation", messages: [] };
            await saveChat(newChat);
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(newChatId);
            currentChatId = newChatId;
        } else {
            history = chats.find(c => c.id === currentChatId)?.messages || [];
        }

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        setChats(prev => prev.map(c => 
            c.id === currentChatId 
                ? { ...c, messages: [...c.messages, userMessage, modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true);
        
        let fullResponse = '';
        try {
            await getAiResponse(history, content, (chunk) => {
                fullResponse += chunk;
                setChats(prev => prev.map(chat => {
                    if (chat.id === currentChatId) {
                        const newMessages = chat.messages.map(msg => 
                            msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                        );
                        return { ...chat, messages: newMessages };
                    }
                    return chat;
                }));
            });

            if (isNewChat && fullResponse.trim()) {
                const finalModelMessage: Message = { id: modelMessageId, role: 'model', content: fullResponse };
                const messagesForTitle: Message[] = [userMessage, finalModelMessage];

                getTitleForChat(messagesForTitle)
                    .then(newTitle => {
                        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle } : c));
                    })
                    .catch(error => {
                        console.error("Error generating title for new chat:", error);
                    });
            }
        } catch (error: any) {
             console.error("Error getting AI response:", error);
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: error.message || "Something went wrong. Please check your connection or API key." }
                                : msg
                        )
                    };
                }
                return chat;
            }));
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleRegenerateResponse = async () => {
        if (!activeChat || isAiLoading) return;
        const messages = [...activeChat.messages];
        const lastModelMessageIndex = messages.map(m => m.role).lastIndexOf('model');
        if (lastModelMessageIndex < 0) return;

        const lastUserMessageIndex = messages.slice(0, lastModelMessageIndex).map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex < 0) return;

        const lastUserMessageContent = messages[lastUserMessageIndex].content;
        const history = messages.slice(0, lastUserMessageIndex);

        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        setChats(prev => prev.map(c => 
            c.id === activeChat.id 
                ? { ...c, messages: [...history, messages[lastUserMessageIndex], modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true);
        let fullResponse = '';
        try {
            await getAiResponse(history, lastUserMessageContent, (chunk) => {
                fullResponse += chunk;
                setChats(prev => prev.map(chat => {
                    if (chat.id === activeChat.id) {
                         const newMessages = chat.messages.map(msg => 
                            msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                        );
                        return { ...chat, messages: newMessages };
                    }
                    return chat;
                }));
            });
        } catch (error: any) {
             console.error("Error regenerating AI response:", error);
             setChats(prev => prev.map(chat => {
                 if (chat.id === activeChat.id) {
                     return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: error.message || "Failed to regenerate. Please try again." }
                                : msg
                        )
                    };
                 }
                 return chat;
            }));
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
        setChats(prev => {
            const newChats = prev.map(c => (c.id === id ? { ...c, title: newTitle } : c));
            const chatToSave = newChats.find(c => c.id === id);
            if (chatToSave) {
                saveChat(chatToSave).catch(err => console.error("Failed to save renamed chat", err));
            }
            return newChats;
        });
    };

    const handleDeleteChat = async (id: string) => {
        try {
            await deleteChat(id);
            const chatToDeleteIndex = chats.findIndex(c => c.id === id);
            const remainingChats = chats.filter(c => c.id !== id);
            setChats(remainingChats);

            if (activeChatId === id) {
                if (remainingChats.length > 0) {
                    const newActiveIndex = Math.max(0, chatToDeleteIndex - 1);
                    setActiveChatId(remainingChats[newActiveIndex].id);
                } else {
                    setActiveChatId(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
        }
    };

    const handleDeleteAllChats = () => {
        if (chats.length > 0) {
            setIsConfirmDeleteAllOpen(true);
        }
    };

    const executeDeleteAllChats = async () => {
        try {
            await deleteAllChats();
            setChats([]);
            setActiveChatId(null);
            setIsSidebarOpen(false);
        } catch (error) {
            console.error("Failed to delete all chats:", error);
        } finally {
            setIsConfirmDeleteAllOpen(false);
        }
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleToggleSpeak = (message: Message) => {
        if (speakingMessageId === message.id) {
            speechSynthesis.cancel();
            setSpeakingMessageId(null);
        } else {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(message.content);
            utterance.onend = () => setSpeakingMessageId(null);
            utterance.onerror = () => setSpeakingMessageId(null);
            speechSynthesis.speak(utterance);
            setSpeakingMessageId(message.id);
        }
    };

    const handleExportChat = () => {
        if (!activeChat) return;
        const fileContent = activeChat.messages
            .map(msg => `${msg.role === 'user' ? 'User' : 'Cognito'}: ${msg.content}`)
            .join('\n\n');
        
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeChat.title.replace(/ /g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSaveProfile = (newName: string) => {
        setUserName(newName);
        setIsProfileModalOpen(false);
    };

    const handleToggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    if (isDbLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="bg-background dark:bg-[#141414] min-h-screen flex text-card-foreground dark:text-gray-200 overflow-hidden">
            <Sidebar 
                chats={chats}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onRenameChat={handleRenameChat}
                onDeleteChat={handleDeleteChat}
                onDeleteAllChats={handleDeleteAllChats}
                isSidebarOpen={isSidebarOpen}
                onExportChat={handleExportChat}
                userName={userName}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onAboutClick={() => setIsAboutModalOpen(true)}
                theme={theme}
                onToggleTheme={handleToggleTheme}
            />
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
            <div className="flex-1 flex flex-col relative">
                <header className="flex items-center justify-center p-4 border-b border-card-border dark:border-zinc-800 relative">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md border border-transparent hover:border-card-border dark:hover:border-zinc-700 absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className={`text-xl font-semibold tracking-wider text-center truncate px-12 md:px-0 ${activeChat ? 'text-primary dark:text-yellow-400 text-outline' : 'text-card-foreground/70 dark:text-gray-400'}`}>
                        {activeChat ? activeChat.title : 'Your Personal AI Assistant'}
                    </h1>
                </header>
                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-50 pointer-events-none">
                        <CognitoLogo className="h-96 w-96" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {!activeChat ? (
                           <div className="flex h-full items-center justify-center">
                                <div className="relative text-center flex flex-col items-center gap-4" style={{ top: '-5rem' }}>
                                    <CognitoLogo className="w-24 h-24" />
                                    <div className="text-center">
                                        <h1 className="text-3xl font-bold text-card-foreground dark:text-gray-200">Hello, {userName}!</h1>
                                        <p className="mt-1 text-lg text-card-foreground/80 dark:text-gray-300">How can I help you today?</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {activeChat.messages.map((msg, index) => (
                                    <div key={msg.id} style={{ animationDelay: `${index * 100}ms` }} className="fade-in-up">
                                        <MessageComponent 
                                            message={msg}
                                            isLastMessage={index === activeChat.messages.length - 1 && msg.role === 'model'}
                                            onCopy={handleCopyText}
                                            onSpeak={handleToggleSpeak}
                                            onRegenerate={handleRegenerateResponse}
                                            speakingMessageId={speakingMessageId}
                                        />
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                    <ChatInput 
                        onSendMessage={handleSendMessage} 
                        isLoading={isAiLoading} 
                        showSuggestions={!activeChat || activeChat.messages.length === 0}
                    />
                </main>
            </div>

            <ProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveProfile}
                currentName={userName}
            />
            <AboutModal 
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
            />
            <ConfirmationModal
                isOpen={isConfirmDeleteAllOpen}
                onClose={() => setIsConfirmDeleteAllOpen(false)}
                onConfirm={executeDeleteAllChats}
                title="Clear All Conversations?"
                message="This will permanently delete all your conversations. This action cannot be undone."
                confirmButtonText="Delete All"
            />
        </div>
    );
};

export default App;