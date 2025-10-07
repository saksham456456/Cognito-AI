

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
import PythonPlayground from './components/PythonPlayground';
import PythonDisintegrationScreen from './components/PythonDisintegrationScreen';

const App: React.FC = () => {
    // State variables ko define kar rahe hain using useState hook.
    const [isAiLoading, setIsAiLoading] = useState(false); // AI response generate kar raha hai ya nahi.
    const [chats, setChats] = useState<Chat[]>([]); // Saare chats ka array.
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // Currently open chat ka ID.
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile pe sidebar open hai ya nahi.
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null); // Kaunsa message text-to-speech se bola ja raha hai.
    const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Operator'); // User ka naam, localStorage se load karte hain.
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Profile modal open hai ya nahi.
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // About modal open hai ya nahi.
    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false); // "Delete all" confirmation modal open hai ya nahi.
    const [isDbLoading, setIsDbLoading] = useState(true); // Database se chats load ho rahe hain ya nahi.
    const [currentView, setCurrentView] = useState<'chat' | 'python'>('chat'); // Current view 'chat' hai ya 'python'.
    const [isDisintegrating, setIsDisintegrating] = useState(false); // Python view se bahar aane ka animation chal raha hai ya nahi.
    
    // useRef hooks ka istemal DOM elements ya persistent values ko store karne ke liye.
    const messagesEndRef = useRef<HTMLDivElement>(null); // Chat ke end tak scroll karne ke liye reference.
    const saveTimeoutRef = useRef<number | null>(null); // Chat ko save karne ke liye debounce timer.
    const chatsRef = useRef(chats); // chats state ka current value hold karne ke liye, taki stale closures se bacha ja sake.
    chatsRef.current = chats;

    // Active chat ko chats array se find kar rahe hain.
    const activeChat = chats.find(c => c.id === activeChatId);

     // useEffect hook component ke mount hone par chalta hai (dependency array [] khali hai).
     // Yeh background particle animation setup karta hai.
     useEffect(() => {
        // Dark theme ko default set kar rahe hain
        document.documentElement.classList.add('dark');
        const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        let mouse = { x: null as number | null, y: null as number | null };

        // Canvas ko window ke size ka banate hain.
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Mouse movement ko track karte hain.
        window.addEventListener('mousemove', (event) => {
            mouse.x = event.x;
            mouse.y = event.y;
        });
        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        // Particle class define kar rahe hain. Har particle ka اپنا x, y, size, speed, aur color hoga.
        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;

            constructor(x: number, y: number, size: number, speedX: number, speedY: number, color: string) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.speedX = speedX;
                this.speedY = speedY;
                this.color = color;
            }

            // Particle ko canvas pe draw karta hai.
            draw() {
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                ctx!.fillStyle = this.color;
                ctx!.fill();
            }

            // Particle ki position update karta hai aur use draw karta hai.
            update() {
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
                this.x += this.speedX;
                this.y += this.speedY;
                this.draw();
            }
        }

        // Shuruaat mein particles banate hain.
        const initParticles = () => {
            particles = [];
            const numberOfParticles = (canvas.height * canvas.width) / 9000;
            for (let i = 0; i < numberOfParticles; i++) {
                const size = Math.random() * 1.5 + 0.5;
                const x = Math.random() * (innerWidth - size * 2 - size * 2) + size * 2;
                const y = Math.random() * (innerHeight - size * 2 - size * 2) + size * 2;
                const speedX = Math.random() * 0.4 - 0.2;
                const speedY = Math.random() * 0.4 - 0.2;
                const color = 'hsla(48, 100%, 55%, 0.5)';
                particles.push(new Particle(x, y, size, speedX, speedY, color));
            }
        };

        // Nazdeeki particles ke beech mein line draw karta hai.
        const connectParticles = () => {
            const maxDistance = 100;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) +
                                     ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                    if (distance < maxDistance * maxDistance) {
                        const opacity = 1 - (distance / (maxDistance * maxDistance));
                        ctx!.strokeStyle = `hsla(220, 100%, 65%, ${opacity})`;
                        ctx!.lineWidth = 0.5;
                        ctx!.beginPath();
                        ctx!.moveTo(particles[a].x, particles[a].y);
                        ctx!.lineTo(particles[b].x, particles[b].y);
                        ctx!.stroke();
                    }
                }
            }
        };

        // Animation loop jo har frame pe chalta hai.
        const animate = () => {
            ctx!.clearRect(0, 0, innerWidth, innerHeight);
            particles.forEach(p => p.update());
            connectParticles();
            animationFrameId = requestAnimationFrame(animate);
        };
        
        initParticles();
        animate();

        // Cleanup function: component unmount hone par event listeners aur animation frame ko remove karta hai.
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Yeh useEffect app start hone par IndexedDB se chats load karta hai.
    useEffect(() => {
        const init = async () => {
            try {
                const startTime = Date.now();
                const loadedChats = await loadChats();
                setChats(loadedChats);
                if (loadedChats.length > 0) {
                    setActiveChatId(loadedChats[0].id); // Pehle chat ko active set karte hain.
                }
                const elapsedTime = Date.now() - startTime;
                const minLoadingTime = 2500; // Minimum 2.5 seconds ka loading screen dikhate hain.
                if (elapsedTime < minLoadingTime) {
                    await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
                }
            } catch (error) {
                console.error("Database se chats load karne mein fail ho gaya:", error);
            } finally {
                setIsDbLoading(false); // Loading state ko false set karte hain.
            }
        };
        init();
    }, []);

    // Jab bhi userName change hota hai, use localStorage mein save karte hain.
    useEffect(() => {
        localStorage.setItem('userName', userName);
    }, [userName]);

    // Yeh useEffect active chat ke messages ya title change hone par use DB mein save karta hai.
    // Debouncing (setTimeout) use kiya gaya hai taki har chote change pe save na ho.
    useEffect(() => {
        if (!activeChat || isDbLoading) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            const chatToSave = chatsRef.current.find(c => c.id === activeChat.id);
            if (chatToSave) {
                saveChat(chatToSave).catch(error => console.error("Chat save karne mein fail ho gaya:", error));
            }
        }, 500); // 500ms ke delay ke baad save hoga.

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [activeChat?.messages, activeChat?.title, isDbLoading]);
    
    // Jab bhi naya message aata hai, view ko neeche scroll karte hain.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);

    // User jab message bhejta hai to yeh function handle karta hai.
    const handleSendMessage = async (content: string) => {
        let currentChatId = activeChatId;
        let history: Message[] = [];
        let isNewChat = false;
        
        // Agar koi active chat nahi hai, to ek naya chat banate hain.
        if (!currentChatId) {
            isNewChat = true;
            const newChatId = Date.now().toString();
            const newChat: Chat = { id: newChatId, title: "New Conversation", messages: [] };
            await saveChat(newChat); // Naye chat ko DB mein save karte hain.
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(newChatId);
            currentChatId = newChatId;
        } else {
            // Purane chat ka history lete hain.
            history = chats.find(c => c.id === currentChatId)?.messages || [];
        }

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
        const modelMessageId = (Date.now() + 1).toString();
        // AI ke response ke liye ek placeholder message add karte hain.
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        // UI ko turant update karte hain user message aur AI placeholder ke sath.
        setChats(prev => prev.map(c => 
            c.id === currentChatId 
                ? { ...c, messages: [...c.messages, userMessage, modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true); // Loading state on.
        
        let fullResponse = '';
        try {
            // Gemini API se streaming response lete hain.
            await getAiResponse(history, content, (chunk) => {
                fullResponse += chunk;
                // Har chunk ke aane par UI ko update karte hain.
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

            // Agar naya chat tha aur response aa gaya, to uske liye title generate karte hain.
            if (isNewChat && fullResponse.trim()) {
                const finalModelMessage: Message = { id: modelMessageId, role: 'model', content: fullResponse };
                const messagesForTitle: Message[] = [userMessage, finalModelMessage];

                getTitleForChat(messagesForTitle)
                    .then(newTitle => {
                        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle } : c));
                    })
                    .catch(error => {
                        console.error("Naye chat ke liye title generate karne mein error:", error);
                    });
            }
        } catch (error: any) {
             console.error("AI response lene mein error:", error);
            // Error ko UI pe dikhate hain.
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: `Error: ${error.message}` || "Ek error aayi. Apna connection ya API key check karein." }
                                : msg
                        )
                    };
                }
                return chat;
            }));
        } finally {
            setIsAiLoading(false); // Loading state off.
        }
    };
    
    // Last response ko regenerate karne ke liye function.
    const handleRegenerateResponse = async () => {
        if (!activeChat || isAiLoading) return;
        const messages = [...activeChat.messages];
        // Last model message aur usse pehle wale user message ko dhundte hain.
        const lastModelMessageIndex = messages.map(m => m.role).lastIndexOf('model');
        if (lastModelMessageIndex < 0) return;

        const lastUserMessageIndex = messages.slice(0, lastModelMessageIndex).map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex < 0) return;

        const lastUserMessageContent = messages[lastUserMessageIndex].content;
        const history = messages.slice(0, lastUserMessageIndex);

        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        // UI se purana model response hatake naya placeholder add karte hain.
        setChats(prev => prev.map(c => 
            c.id === activeChat.id 
                ? { ...c, messages: [...history, messages[lastUserMessageIndex], modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true);
        let fullResponse = '';
        try {
            // Phir se API call karte hain.
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
             console.error("AI response regenerate karne mein error:", error);
             setChats(prev => prev.map(chat => {
                 if (chat.id === activeChat.id) {
                     return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: `Error: ${error.message}` || "Regenerate nahi ho paya. Phir se try karein." }
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

    // Naya chat shuru karne ke liye.
    const handleNewChat = () => {
        setActiveChatId(null);
        setIsSidebarOpen(false);
    };

    // List se kisi chat ko select karne ke liye.
    const handleSelectChat = (id: string) => {
        setActiveChatId(id);
        setIsSidebarOpen(false);
    };
    
    // Chat ka title badalne ke liye.
    const handleRenameChat = (id: string, newTitle: string) => {
        setChats(prev => {
            const newChats = prev.map(c => (c.id === id ? { ...c, title: newTitle } : c));
            const chatToSave = newChats.find(c => c.id === id);
            if (chatToSave) {
                saveChat(chatToSave).catch(err => console.error("Renamed chat save karne mein fail", err));
            }
            return newChats;
        });
    };

    // Ek chat ko delete karne ke liye.
    const handleDeleteChat = async (id: string) => {
        try {
            await deleteChat(id);
            const chatToDeleteIndex = chats.findIndex(c => c.id === id);
            const remainingChats = chats.filter(c => c.id !== id);
            setChats(remainingChats);

            // Agar active chat hi delete ho gaya to naya active chat set karte hain.
            if (activeChatId === id) {
                if (remainingChats.length > 0) {
                    const newActiveIndex = Math.max(0, chatToDeleteIndex - 1);
                    setActiveChatId(remainingChats[newActiveIndex].id);
                } else {
                    setActiveChatId(null);
                }
            }
        } catch (error) {
            console.error("Chat delete karne mein fail:", error);
        }
    };

    // Saare chats delete karne ke liye confirmation modal kholta hai.
    const handleDeleteAllChats = () => {
        if (chats.length > 0) {
            setIsConfirmDeleteAllOpen(true);
        }
    };

    // Confirmation ke baad saare chats ko delete karta hai.
    const executeDeleteAllChats = async () => {
        try {
            await deleteAllChats();
            setChats([]);
            setActiveChatId(null);
            setIsSidebarOpen(false);
        } catch (error) {
            console.error("Saare chats delete karne mein fail:", error);
        } finally {
            setIsConfirmDeleteAllOpen(false);
        }
    };

    // Text ko clipboard pe copy karne ke liye.
    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Text-to-speech ko toggle karne ke liye.
    const handleToggleSpeak = (message: Message) => {
        if (speakingMessageId === message.id) {
            speechSynthesis.cancel(); // Agar pehle se bol raha hai to band karo.
            setSpeakingMessageId(null);
        } else {
            speechSynthesis.cancel(); // Koi aur message bol raha ho to use band karo.
            const utterance = new SpeechSynthesisUtterance(message.content);
            utterance.onend = () => setSpeakingMessageId(null);
            utterance.onerror = () => setSpeakingMessageId(null);
            speechSynthesis.speak(utterance);
            setSpeakingMessageId(message.id);
        }
    };

    // Active chat ko text file mein export karne ke liye.
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

    // Profile modal mein naam save karne ke liye.
    const handleSaveProfile = (newName: string) => {
        setUserName(newName);
        setIsProfileModalOpen(false);
    };

    // 'Chat' aur 'Python' view ke beech switch karne ke liye.
    const handleViewChange = (view: 'chat' | 'python') => {
        if (isDisintegrating) return;

        // Python se chat view pe aate time disintegration animation dikhate hain.
        if (currentView === 'python' && view === 'chat') {
            setIsDisintegrating(true);
            setTimeout(() => {
                setCurrentView('chat');
                setIsDisintegrating(false);
            }, 4000); // 4 second ka animation
        } else {
            setCurrentView(view);
        }
    };

    // Jab tak DB se data load ho raha hai, LoadingScreen dikhate hain.
    if (isDbLoading) {
        return <LoadingScreen />;
    }

    // Main component ka JSX structure.
    return (
        <div className="bg-transparent h-screen flex text-card-foreground overflow-hidden">
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
                currentView={currentView}
                onViewChange={handleViewChange}
            />
             {/* Mobile pe sidebar khula ho to background ko overlay karte hain */}
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
            
            <div className="flex-1 flex flex-col relative">
                 {/* Conditional rendering: view ke hisab se component dikhate hain */}
                 {isDisintegrating ? (
                    <PythonDisintegrationScreen />
                 ) : currentView === 'chat' ? (
                    <>
                        <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-card-border glassmorphism relative">
                            {/* Mobile ke liye menu button */}
                            <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md border border-transparent hover:border-card-border absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
                                <MenuIcon className="h-6 w-6" />
                            </button>
                            <h1 className={`font-heading text-xl font-bold tracking-widest text-center truncate px-12 md:px-0 uppercase animate-neon-flicker`}>
                                {activeChat ? activeChat.title : 'Cognito AI Assistant'}
                            </h1>
                        </header>
                        <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                             {/* Background mein halka sa logo (watermark) */}
                             <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none watermark">
                                <CognitoLogo className="h-96 w-96" />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {/* Agar koi chat active nahi hai to welcome screen dikhate hain */}
                                {!activeChat ? (
                                <div className="flex h-full items-center justify-center">
                                        <div className="relative text-center flex flex-col items-center gap-4" style={{ top: '-5rem' }}>
                                            <CognitoLogo className="w-28 h-28" />
                                            <div className="text-center">
                                                <h1 className="font-heading text-4xl font-bold text-gray-200">Welcome, {userName}</h1>
                                                <p className="mt-1 text-lg text-gray-400">Main digital duniya mein aapki kaise madad kar sakta hoon?</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Active chat ke saare messages ko render karte hain
                                    <div className="max-w-3xl mx-auto space-y-8">
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
                    </>
                ) : (
                    <PythonPlayground onToggleSidebar={() => setIsSidebarOpen(true)} />
                )}
            </div>

            {/* Modals ko render kar rahe hain */}
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
                title="Saare Logs Mita Dein?"
                message="Isse saare conversation logs hamesha ke liye mit jayenge. Yeh action undo nahi kiya ja sakta."
                confirmButtonText="Sab Mitayein"
            />
        </div>
    );
};

export default App;