import React, { useState, useEffect, useRef } from 'react';
import { getAiResponse, getTitleForChat } from './services/geminiService';
import { getAllChats, saveChat, deleteChat, migrateFromLocalStorage, deleteAllChats } from './services/dbService';
import type { Message, Chat } from './types';
import LoadingScreen from './components/LoadingScreen';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import { CognitoLogo, CognitoLogoText } from './components/Logo';
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons';

const App: React.FC = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<number | null>(null);

    const activeChat = chats.find(c => c.id === activeChatId);

    // Theme management
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Load from IndexedDB on initial render
    useEffect(() => {
        async function loadData() {
            try {
                await migrateFromLocalStorage(); // One-time migration
                const dbChats = await getAllChats();
                setChats(dbChats);
            } catch (error) {
                console.error("Failed to load chats from DB:", error);
            } finally {
                setTimeout(() => setIsAppLoading(false), 500);
            }
        }
        loadData();
    }, []);

    // Debounced effect to save the active chat
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (!activeChat) return;

        saveTimeoutRef.current = window.setTimeout(() => {
            saveChat(activeChat);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [activeChat]);
    
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

            if (isNewChat) {
                const finalMessages = [userMessage, { ...modelPlaceholder, content: fullResponse }];
                const newTitle = await getTitleForChat(finalMessages);
                setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle } : c));
            }
        } catch (error) {
             console.error("Error getting AI response:", error);
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: "Something went wrong. Please check your connection or API key." }
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
        } catch (error) {
             console.error("Error regenerating AI response:", error);
             setChats(prev => prev.map(chat => {
                 if (chat.id === activeChat.id) {
                     return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: "Failed to regenerate. Please try again." }
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
        setChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    };

    const handleDeleteChat = async (id: string) => {
        const chatToDeleteIndex = chats.findIndex(c => c.id === id);
        if (chatToDeleteIndex < 0) return;

        if (id === activeChatId && saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        const remainingChats = chats.filter(c => c.id !== id);
        setChats(remainingChats);

        if (activeChatId === id) {
            setActiveChatId(remainingChats.length > 0 ? remainingChats[Math.max(0, chatToDeleteIndex - 1)].id : null);
        }

        try {
            await deleteChat(id);
        } catch (error) {
            console.error("Failed to delete chat from DB:", error);
            alert("Error: Could not permanently delete the chat. It may reappear after a refresh.");
        }
    };

    const handleDeleteAllChats = async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }

        setChats([]);
        setActiveChatId(null);
        setIsSidebarOpen(false);

        try {
            await deleteAllChats();
        } catch (error) {
            console.error("Failed to delete all chats from DB:", error);
            alert("Error: Could not delete all chats. They may reappear after a refresh.");
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

    if (isAppLoading) {
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
                theme={theme}
                setTheme={setTheme}
                onExportChat={handleExportChat}
            />
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
            <div className="flex-1 flex flex-col relative">
                <header className="flex items-center p-4 border-b border-card-border dark:border-[#333] md:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold text-primary dark:text-yellow-400 tracking-wider mx-auto">{activeChat?.title || 'COGNITO'}</h1>
                </header>
                <main className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-[0.02] pointer-events-none">
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