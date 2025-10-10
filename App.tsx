import React, { useState, useEffect, useRef } from 'react';
import { startChat, getTitleForChat } from './services/geminiService';
import { saveChat, loadChats, deleteChat, deleteAllChats } from './services/dbService';
import type { Message, Chat, AiMode, AppView } from './types';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import { CognitoLogo } from './components/Logo';
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons';
import ProfileModal from './components/ProfileModal';
import LoadingScreen from './components/LoadingScreen';
import AboutModal from './components/AboutModal';
import ConfirmationModal from './components/ConfirmationModal';
import BackgroundCanvas from './components/BackgroundCanvas';
import CoreLoadingScreen from './components/CoreLoadingScreen';
import CodingPlayground from './components/CodingPlayground';
import CoreDisintegrationScreen from './components/CoreDisintegrationScreen';


const App: React.FC = () => {
    // Defining state variables using the useState hook.
    const [isAiLoading, setIsAiLoading] = useState(false); // Is the AI generating a response?
    const [chats, setChats] = useState<Chat[]>([]); // Array of all chats.
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // The ID of the currently open chat.
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Is the sidebar open on mobile?
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null); // Which message is being spoken by text-to-speech.
    const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Operator'); // The user's name, loaded from localStorage.
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Is the profile modal open?
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // Is the about modal open?
    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false); // Is the "Delete all" confirmation modal open?
    const [isDbLoading, setIsDbLoading] = useState(true); // Are chats being loaded from the database?
    const [backgroundAnimation, setBackgroundAnimation] = useState<string>(() => localStorage.getItem('backgroundAnimation') || 'particles'); // Background animation type.
    const [aiMode, setAiMode] = useState<AiMode>('cognito'); // Current AI mode.
    const [inputRect, setInputRect] = useState<DOMRect | null>(null); // Position of the input bar.
    
    // App view management states
    const [currentView, setCurrentView] = useState<AppView>('chat');
    const [isTransitioning, setIsTransitioning] = useState(false); // For entering the core
    const [isExiting, setIsExiting] = useState(false); // For exiting the core
    
    // Using useRef hooks to store DOM elements or persistent values.
    const messagesEndRef = useRef<HTMLDivElement>(null); // Reference to scroll to the end of the chat.
    const saveTimeoutRef = useRef<number | null>(null); // Debounce timer for saving the chat.
    const chatsRef = useRef(chats); // Holds the current value of the chats state to avoid stale closures.
    const stopGenerationRef = useRef(false); // Flag to stop the AI response stream.
    chatsRef.current = chats;

    // Finding the active chat from the chats array.
    const activeChat = chats.find(c => c.id === activeChatId);

     // This useEffect hook runs when the component mounts.
     useEffect(() => {
        // Setting the dark theme by default.
        document.documentElement.classList.add('dark');
    }, []);

    // This useEffect loads chats from IndexedDB when the app starts.
    useEffect(() => {
        const init = async () => {
            try {
                const startTime = Date.now();
                const loadedChats = await loadChats();
                setChats(loadedChats);
                if (loadedChats.length > 0) {
                    setActiveChatId(loadedChats[0].id); // Set the first chat as active.
                }
                const elapsedTime = Date.now() - startTime;
                const minLoadingTime = 4000; // Show the loading screen for a minimum of 4.0 seconds.
                if (elapsedTime < minLoadingTime) {
                    await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
                }
            } catch (error) {
                console.error("Failed to load chats from the database:", error);
            } finally {
                setIsDbLoading(false); // Set the loading state to false.
            }
        };
        init();
    }, []);

    // Whenever userName changes, save it to localStorage.
    useEffect(() => {
        localStorage.setItem('userName', userName);
    }, [userName]);

    // Save the background animation choice to localStorage.
    useEffect(() => {
        localStorage.setItem('backgroundAnimation', backgroundAnimation);
    }, [backgroundAnimation]);

    // This useEffect saves the active chat to the DB whenever its messages or title change.
    // Debouncing (setTimeout) is used to avoid saving on every small change.
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
        }, 500); // Saves after a 500ms delay.

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [activeChat?.messages, activeChat?.title, isDbLoading]);
    
    // Scroll the view down whenever a new message arrives.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);
    
    const handleStopGeneration = () => {
        stopGenerationRef.current = true;
        setIsAiLoading(false);
    }

    // REVAMPED: Handles the view transition between 'chat' and 'coding' modes.
    const handleAiModeChange = (newMode: AiMode) => {
        const newView: AppView = newMode === 'code-assistant' ? 'coding' : 'chat';

        if (newView !== currentView) {
            if (newView === 'coding') {
                // If there's no active chat, create one before entering.
                if (!activeChatId) {
                    handleNewChat(false); // Create a new chat but don't switch view yet.
                }
                setIsTransitioning(true);
                setTimeout(() => {
                    setCurrentView('coding');
                    setAiMode('code-assistant');
                    setIsTransitioning(false);
                }, 3200); // Matches the 3.2s loading screen animation
            } else { // Exiting coding mode
                setIsExiting(true);
                // Pre-render the chat view behind the exit animation overlay
                setTimeout(() => {
                    setCurrentView('chat');
                    setAiMode('cognito');
                }, 500); // Switch view after 500ms, allowing overlay to be opaque
                
                // Unmount the exit animation overlay after it finishes
                setTimeout(() => {
                    setIsExiting(false);
                }, 2800); // Matches the 2.8s exit animation
            }
        } else {
             setAiMode(newMode);
        }
    };


    // REVAMPED: This function handles when the user sends a message.
    const handleSendMessage = async (content: string, context?: { code: string; output: string; lang: string }) => {
        let currentChatId = activeChatId;
        let history: Message[] = [];
        let isNewChat = false;
        
        // If there's no active chat, create a new one.
        if (!currentChatId) {
            isNewChat = true;
            const newChatId = Date.now().toString();
            const newChat: Chat = { id: newChatId, title: "New Conversation", messages: [] };
            await saveChat(newChat); // Save the new chat to the DB.
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(newChatId);
            currentChatId = newChatId;
        } else {
            // Get the history of the old chat.
            history = chats.find(c => c.id === currentChatId)?.messages || [];
        }

        // NEW: The user-facing message ONLY contains their direct input.
        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: content };
        
        // The message for the API includes the hidden context.
        let messageForApi = content;
        if (currentView === 'coding' && context && (context.code || context.output.trim())) {
            const codeBlock = context.code ? `\n\n**My Code (${context.lang}):**\n\`\`\`${context.lang}\n${context.code}\n\`\`\`` : '';
            const outputBlock = context.output.trim() ? `\n\n**Console Output:**\n\`\`\`\n${context.output.trim()}\n\`\`\`` : '';
            messageForApi = `${content}${codeBlock}${outputBlock}`;
        }
        
        const modelMessageId = (Date.now() + 1).toString();
        // Add a placeholder message for the AI's response.
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        // Immediately update the UI with the user message and AI placeholder.
        setChats(prev => prev.map(c => 
            c.id === currentChatId 
                ? { ...c, messages: [...c.messages, userMessage, modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true); // Loading state on.
        stopGenerationRef.current = false; // Reset the stop flag.
        
        let fullResponse = '';
        try {
            // Determine which AI mode to use for the API call.
            const modeForAPI = currentView === 'coding' ? 'code-assistant' : 'cognito';
            const chatSession = startChat(history, modeForAPI);
            const responseStream = await chatSession.sendMessageStream({ message: messageForApi });
            
            for await (const chunk of responseStream) {
                if (stopGenerationRef.current) break;
                
                if (chunk && chunk.text) {
                    fullResponse += chunk.text;
                    // Update the UI as each chunk arrives.
                    setChats(prev => prev.map(chat => {
                        if (chat.id === currentChatId) {
                            const newMessages = chat.messages.map(msg => 
                                msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                            );
                            return { ...chat, messages: newMessages };
                        }
                        return chat;
                    }));
                }
            }


            // If it was a new chat and a response was received, generate a title for it.
            if (isNewChat && fullResponse.trim()) {
                const finalModelMessage: Message = { id: modelMessageId, role: 'model', content: fullResponse };
                const messagesForTitle: Message[] = [userMessage, finalModelMessage];

                // For a new coding session, give it a default "Coding Session" title.
                const titlePromise = currentView === 'coding' 
                    ? Promise.resolve('Coding Session')
                    : getTitleForChat(messagesForTitle);

                titlePromise
                    .then(newTitle => {
                        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle } : c));
                    })
                    .catch(error => {
                        console.error("Error generating title for new chat:", error);
                    });
            }
        } catch (error: any) {
             console.error("Error getting AI response:", error);
            // Show the error on the UI.
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: `**Error:** ${error.message}` || "**An error occurred.** Please check your connection or API key." }
                                : msg
                        )
                    };
                }
                return chat;
            }));
        } finally {
            setIsAiLoading(false); // Loading state off.
            stopGenerationRef.current = false;
        }
    };
    
    // Function to regenerate the last response.
    const handleRegenerateResponse = async () => {
        if (!activeChat || isAiLoading) return;
        const messages = [...activeChat.messages];
        // Find the last model message and the user message before it.
        const lastModelMessageIndex = messages.map(m => m.role).lastIndexOf('model');
        if (lastModelMessageIndex < 0) return;

        const lastUserMessageIndex = messages.slice(0, lastModelMessageIndex).map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex < 0) return;

        const lastUserMessageContent = messages[lastUserMessageIndex].content;
        const history = messages.slice(0, lastUserMessageIndex);

        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        // Remove the old model response from the UI and add a new placeholder.
        setChats(prev => prev.map(c => 
            c.id === activeChat.id 
                ? { ...c, messages: [...history, messages[lastUserMessageIndex], modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true);
        stopGenerationRef.current = false; // Reset the stop flag.
        let fullResponse = '';
        try {
            const modeForAPI = currentView === 'coding' ? 'code-assistant' : 'cognito';
            const chatSession = startChat(history, modeForAPI);
            const responseStream = await chatSession.sendMessageStream({ message: lastUserMessageContent });

            for await (const chunk of responseStream) {
                 if (stopGenerationRef.current) break;
                 if (chunk && chunk.text) {
                    fullResponse += chunk.text;
                    setChats(prev => prev.map(chat => {
                        if (chat.id === activeChat.id) {
                            const newMessages = chat.messages.map(msg => 
                                msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                            );
                            return { ...chat, messages: newMessages };
                        }
                        return chat;
                    }));
                }
            }
        } catch (error: any) {
             console.error("Error regenerating AI response:", error);
             setChats(prev => prev.map(chat => {
                 if (chat.id === activeChat.id) {
                     return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: `**Error:** ${error.message}` || "**Failed to regenerate.** Please try again." }
                                : msg
                        )
                    };
                 }
                 return chat;
            }));
        } finally {
            setIsAiLoading(false);
            stopGenerationRef.current = false;
        }
    };

    // To start a new chat.
    const handleNewChat = (changeView = true) => {
        // BUG FIX: If in coding mode, create a new session but stay in coding mode.
        if (currentView === 'coding') {
            const newChatId = Date.now().toString();
            const newChat: Chat = { id: newChatId, title: "New Coding Session", messages: [] };
            saveChat(newChat).then(() => {
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChatId);
                if (changeView) setIsSidebarOpen(false);
            });
        } else {
            setActiveChatId(null);
            if (changeView) setIsSidebarOpen(false);
        }
    };

    // To select a chat from the list.
    const handleSelectChat = (id: string) => {
        if (currentView === 'coding') {
            handleAiModeChange('cognito');
        }
        setActiveChatId(id);
        setIsSidebarOpen(false);
    };
    
    // To change the title of a chat.
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

    // To delete a chat.
    const handleDeleteChat = async (id: string) => {
        try {
            await deleteChat(id);
            const chatToDeleteIndex = chats.findIndex(c => c.id === id);
            const remainingChats = chats.filter(c => c.id !== id);
            setChats(remainingChats);

            // If the active chat was deleted, set a new active chat.
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

    // Opens the confirmation modal to delete all chats.
    const handleDeleteAllChats = () => {
        if (chats.length > 0) {
            setIsConfirmDeleteAllOpen(true);
        }
    };

    // Deletes all chats after confirmation.
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

    // To copy text to the clipboard.
    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // To toggle text-to-speech.
    const handleToggleSpeak = (message: Message) => {
        if (speakingMessageId === message.id) {
            speechSynthesis.cancel(); // If it's already speaking, stop it.
            setSpeakingMessageId(null);
        } else {
            speechSynthesis.cancel(); // If another message is speaking, stop it.
            const utterance = new SpeechSynthesisUtterance(message.content);
            utterance.onend = () => setSpeakingMessageId(null);
            utterance.onerror = () => setSpeakingMessageId(null);
            speechSynthesis.speak(utterance);
            setSpeakingMessageId(message.id);
        }
    };

    // To export the active chat to a text file.
    const handleExportChat = () => {
        if (!activeChat) return;
        const fileContent = activeChat.messages
            .map(msg => `${msg.role === 'user' ? userName : 'Cognito'}: ${msg.content}`)
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

    // To save the name in the profile modal.
    const handleSaveProfile = (newName: string) => {
        setUserName(newName);
        setIsProfileModalOpen(false);
    };
    
    const renderChatView = () => (
        <div className="flex-1 flex flex-col relative">
            <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-card-border glassmorphism relative">
                {/* Menu button for mobile */}
                <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md border border-transparent hover:border-card-border absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className={`font-heading text-xl font-bold tracking-widest text-center truncate px-12 md:px-0 uppercase animate-neon-flicker`}>
                    {activeChat ? activeChat.title : 'Cognito AI Assistant'}
                </h1>
            </header>
            <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                 {/* Faint logo in the background (watermark) */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none watermark">
                    <CognitoLogo className="h-96 w-96" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* If no chat is active, show the welcome screen */}
                    {!activeChat ? (
                    <div className="flex h-full items-center justify-center">
                            <div className="relative text-center flex flex-col items-center gap-4" style={{ top: '-5rem' }}>
                                <CognitoLogo className="w-28 h-28" />
                                <div className="text-center">
                                    <h1 className="font-heading text-4xl font-bold text-gray-200">Welcome, {userName}</h1>
                                    <p className="mt-1 text-lg text-gray-400">How can I help you navigate the digital cosmos today?</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Render all messages of the active chat
                        <div className="max-w-3xl mx-auto space-y-8">
                            {activeChat.messages.map((msg, index) => (
                                <div key={msg.id} style={{ animationDelay: `${index * 100}ms` }} className="fade-in-up">
                                    <MessageComponent 
                                        message={msg}
                                        isLastMessage={index === activeChat.messages.length - 1}
                                        isAiLoading={isAiLoading}
                                        onCopy={handleCopyText}
                                        onSpeak={handleToggleSpeak}
                                        onRegenerate={handleRegenerateResponse}
                                        onStopGeneration={handleStopGeneration}
                                        speakingMessageId={speakingMessageId}
                                        inputRect={inputRect}
                                    />
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                <ChatInput 
                    onSendMessage={(message) => handleSendMessage(message)}
                    isLoading={isAiLoading} 
                    showSuggestions={!activeChat || activeChat.messages.length === 0}
                    aiMode={aiMode}
                    onAiModeChange={handleAiModeChange}
                    onRectChange={setInputRect}
                />
            </main>
        </div>
    );

    const renderCurrentView = () => {
        if (currentView === 'coding') {
             return (
                <CodingPlayground 
                    onToggleSidebar={() => setIsSidebarOpen(p => !p)} 
                    onExit={() => handleAiModeChange('cognito')}
                    chat={activeChat ?? null}
                    onSendMessage={handleSendMessage}
                    isLoading={isAiLoading}
                    onCopyCode={handleCopyText}
                    isExiting={isExiting}
                />
            );
        }
        // Fallback to chat view
        return renderChatView();
    };

    // Show LoadingScreen while data is being loaded from the DB.
    if (isDbLoading) {
        return <LoadingScreen />;
    }

    // The main JSX structure of the component.
    return (
        <div className="bg-transparent h-screen flex text-card-foreground overflow-hidden">
            <BackgroundCanvas animationType={backgroundAnimation} />
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
                backgroundAnimation={backgroundAnimation}
                onBackgroundAnimationChange={setBackgroundAnimation}
            />
             {/* If the sidebar is open on mobile, overlay the background */}
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
            
            <main className="flex-1 flex flex-col relative">
                {renderCurrentView()}
            </main>

            {/* OVERLAYS FOR TRANSITIONS */}
            {isTransitioning && <CoreLoadingScreen show={true} />}
            {isExiting && <CoreDisintegrationScreen show={true} />}

            {/* Rendering the modals */}
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
                title="Purge All Logs?"
                message="This will permanently delete all conversation logs. This action cannot be undone."
                confirmButtonText="Purge All"
            />
        </div>
    );
};

export default App;
