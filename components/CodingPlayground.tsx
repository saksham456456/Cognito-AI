import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { Message, Chat } from '../types';
import { MenuIcon, CodeBracketIcon, PythonLogoIcon, SendIcon, ClipboardIcon, CheckIcon, ChevronDownIcon, PlayIcon, PowerIcon, XIcon } from './icons';
import { CognitoLogo } from './Logo';
import MarkdownRenderer from './MarkdownRenderer';

// To tell TypeScript that the 'loadPyodide' function will exist on the 'window' object.
declare global {
    interface Window {
        loadPyodide: (config: { indexURL: string }) => Promise<any>;
    }
}

type Language = 'python' | 'html' | 'css' | 'javascript';

// A dedicated typing indicator for the assistant.
const PulsingDotsIndicator = () => (
    <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="h-1.5 w-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
        <div className="h-1.5 w-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
    </div>
);

const languageInfo: Record<Language, { name: string, boilerplate: string, icon: React.ReactNode }> = {
    python: { 
        name: 'Python', 
        icon: <PythonLogoIcon className="w-5 h-5" />, 
        boilerplate: `a = 42.0
b = 8.0
op = '*'

if op == '+':
    result = a + b
elif op == '-':
    result = a - b
elif op == '*':
    result = a * b
elif op == '/':
    result = a / b if b != 0 else "Error: Division by zero"
else:
    result = "Invalid operation"

print(result)
`
    },
    html: { name: 'HTML', icon: <CodeBracketIcon className="w-5 h-5" />, boilerplate: `<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1></h1>\n  <p>This is a sample page.</p>\n  <script src="script.js"></script>\n</body>\n</html>` },
    css: { name: 'CSS', icon: <CodeBracketIcon className="w-5 h-5" />, boilerplate: `body {\n  font-family: sans-serif;\n  background-color: #f0f0f0;\n  color: #333;\n}\n\nh1 {\n  color: navy;\n}` },
    javascript: { name: 'JavaScript', icon: <CodeBracketIcon className="w-5 h-5" />, boilerplate: `console.log("Hello from JavaScript!");\n\nconst heading = document.querySelector('h1');\nif (heading) {\n  heading.textContent = 'Hello Saksham';\n}` }
};

interface CodingPlaygroundProps {
    onToggleSidebar: () => void;
    onExit: () => void;
    chat: Chat | null;
    onSendMessage: (message: string, context?: { code: string; output: string; lang: string }) => void;
    isLoading: boolean;
    onCopyCode: (code: string) => void;
    isExiting: boolean;
    t: (key: string, fallback?: any) => any;
}

const CodingPlayground: React.FC<CodingPlaygroundProps> = ({ 
    onToggleSidebar, 
    onExit, 
    chat, 
    onSendMessage, 
    isLoading, 
    onCopyCode,
    isExiting,
    t
}) => {
    const [activeLang, setActiveLang] = useState<Language>('python');
    const [codes, setCodes] = useState<Record<Language, string>>({
        python: languageInfo.python.boilerplate,
        html: languageInfo.html.boilerplate,
        css: languageInfo.css.boilerplate,
        javascript: languageInfo.javascript.boilerplate,
    });
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    
    // REVAMPED: State for new responsive layout
    const [isAssistantVisible, setIsAssistantVisible] = useState(window.innerWidth >= 1024);
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    
    const [assistantInput, setAssistantInput] = useState('');

    const pyodideRef = useRef<any>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const assistantChatContainerRef = useRef<HTMLDivElement>(null);
    const langDropdownRef = useRef<HTMLDivElement>(null);

    // Effect for Pyodide initialization
    useEffect(() => {
        const loadPyodideEnvironment = async () => {
            setIsPyodideLoading(true);
            setError('');
            const PYODIDE_SCRIPT_ID = 'pyodide-script';
            if (!document.getElementById(PYODIDE_SCRIPT_ID)) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.id = PYODIDE_SCRIPT_ID;
                    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Pyodide script failed to load. Please check your network connection.'));
                    document.head.appendChild(script);
                });
            }
            try {
                if (!window.loadPyodide) throw new Error("window.loadPyodide is not available.");
                const pyodide = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
                if (!pyodide || typeof pyodide.runPythonAsync !== 'function') throw new Error("Pyodide object is invalid.");
                pyodideRef.current = pyodide;
            } catch (err: any) {
                console.error("Pyodide initialization failed:", err);
                setError(err.message || 'Failed to initialize Python environment.');
            } finally {
                setIsPyodideLoading(false);
            }
        };
        loadPyodideEnvironment();
    }, []);

    // Effect for responsive UI and click-outside listeners
    useEffect(() => {
        const handleResize = () => {
             if (window.innerWidth < 1024) {
                setIsAssistantVisible(false);
            } else {
                setIsAssistantVisible(true);
            }
        };
        const handleClickOutside = (event: MouseEvent) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
                setIsLangDropdownOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useLayoutEffect(() => {
        const chatContainer = assistantChatContainerRef.current;
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, [chat?.messages, isAssistantVisible]);
    
    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCodes(prev => ({ ...prev, [activeLang]: e.target.value }));
    };
    
    const handleCopy = () => {
        onCopyCode(codes[activeLang]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const runCode = async () => {
        setOutput('');
        setError('');
        setIsExecuting(true);
        if (activeLang === 'python') {
            await runPythonCode();
        } else {
            runWebCode();
        }
        setIsExecuting(false);
    };

    const runPythonCode = async () => {
        const pyodide = pyodideRef.current;
        if (!pyodide || isPyodideLoading) {
            setError("Python environment is not ready.");
            return;
        };
        try {
            pyodide.globals.set("user_code", codes.python);
            const executionWrapper = `
import sys, io, traceback
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
error = None
try:
    exec(user_code, globals())
except Exception:
    error = traceback.format_exc()
stdout_val = sys.stdout.getvalue()
stderr_val = sys.stderr.getvalue()
if error:
    stderr_val = error
from pyodide.ffi import to_js
to_js({"stdout": stdout_val, "stderr": stderr_val})
            `;
            const results = await pyodide.runPythonAsync(executionWrapper);
            const stdout = results.get("stdout");
            const stderr = results.get("stderr");
            if (stderr) { setError(stderr.trim()); } 
            else { setOutput(stdout.trim()); }
        } catch (err: any) { 
            setError(err.toString()); 
        }
    };

    const runWebCode = () => {
        const combinedHtml = `
            <html><head><style>${codes.css}</style></head>
            <body>${codes.html}<script>${codes.javascript}</script></body></html>
        `;
        if (iframeRef.current) {
            iframeRef.current.srcdoc = combinedHtml;
            setOutput('Web preview rendered successfully.');
        }
    };
    
    const handleAssistantSend = async () => {
        if (!assistantInput.trim() || isLoading) return;
        const consoleContent = error ? `[ERROR] ${error}` : output;
        onSendMessage(assistantInput, { code: codes[activeLang], output: consoleContent, lang: activeLang });
        setAssistantInput('');
    };
    
    const LanguageDropdown = () => (
        <div className="relative" ref={langDropdownRef}>
            <button onClick={() => setIsLangDropdownOpen(o => !o)} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 bg-input hover:bg-input-border text-text-light border border-input-border">
                {languageInfo[activeLang].icon}
                <span>{languageInfo[activeLang].name}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangDropdownOpen && (
                <div className="absolute top-full mt-1 w-40 glassmorphism rounded-lg p-1 z-20 shadow-lg border border-card-border fade-in-up" style={{animationDuration: '150ms'}}>
                    {Object.keys(languageInfo).map(langStr => {
                        const lang = langStr as Language;
                        return (
                            <button key={lang} onClick={() => { setActiveLang(lang); setIsLangDropdownOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${activeLang === lang ? 'bg-primary/20 text-primary' : 'text-text-medium hover:bg-input'}`}>
                                {languageInfo[lang].icon}
                                <span>{languageInfo[lang].name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className={`flex flex-col h-full bg-background crt-effect relative overflow-hidden z-10`}>
             <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-card-border/50 bg-background/80 relative">
                <div className="flex items-center gap-4">
                    <button onClick={onToggleSidebar} className="p-1 rounded-md border border-transparent hover:border-card-border md:hidden">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <CodeBracketIcon className="h-6 w-6 text-primary animate-pulse" />
                        <h1 className="font-heading text-xl font-bold tracking-widest text-primary uppercase" style={{textShadow: '0 0 5px var(--primary-glow)'}}>
                            {t('coding.title')}
                        </h1>
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsAssistantVisible(v => !v)} className="flex lg:hidden items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-input-border hover:border-primary text-text-medium hover:text-primary transition-all duration-200 neon-glow-button">
                       <CognitoLogo className="w-5 h-5" />
                       <span className="hidden sm:inline">{t('coding.toggleAssistant')}</span>
                    </button>
                    <button onClick={onExit} className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95">
                        <PowerIcon className="w-5 h-5"/>
                        <span className="hidden sm:inline">{t('coding.exit')}</span>
                    </button>
                 </div>
            </header>
            
            <div className="flex-1 flex gap-2 p-2 min-h-0">
                {/* Editor & Console Panel */}
                <div className="flex flex-col gap-2 flex-1 min-h-0">
                    {/* Editor Panel */}
                    <div className="flex flex-col flex-1 min-h-0">
                        <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-primary/20 bg-black/30 rounded-t-lg">
                           <LanguageDropdown />
                           <button onClick={handleCopy} className="px-3 py-1.5 rounded-md bg-input hover:bg-input-border text-text-medium hover:text-primary transition-all duration-200 border border-input-border text-xs font-bold flex items-center gap-2 hover:scale-105 active:scale-95">
                                {isCopied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                                <span className="hidden sm:inline">{isCopied ? t('coding.copied') : t('coding.copyCode')}</span>
                           </button>
                        </div>
                        <textarea value={codes[activeLang]} onChange={handleCodeChange} className="flex-1 p-3 bg-black/50 border border-primary/20 rounded-b-lg text-green-400 focus:outline-none focus:border-primary/50 transition-colors resize-none font-code text-sm custom-scrollbar" spellCheck="false" />
                    </div>
                     {/* Console Panel */}
                    <div className="flex flex-col h-2/5 min-h-[200px]">
                         <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-primary/20 bg-black/30 rounded-t-lg">
                            <h2 className="font-code font-semibold text-primary/80 text-sm">{t('coding.consoleHeader')}</h2>
                            <button onClick={runCode} disabled={isExecuting || (activeLang === 'python' && isPyodideLoading)} className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-yellow-400 transition-all duration-200 border border-primary-foreground/20 text-sm font-bold disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 hover:scale-105 active:scale-95">
                               {(isPyodideLoading && activeLang === 'python') || isExecuting ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div> : <PlayIcon className="w-4 h-4"/>}
                               <span className="hidden sm:inline">
                                {(isPyodideLoading && activeLang === 'python') ? t('coding.initializing') : isExecuting ? t('coding.running') : t('coding.run')}
                               </span>
                            </button>
                        </div>
                        <div className="flex-1 p-3 bg-black/50 border border-primary/20 rounded-b-lg overflow-y-auto custom-scrollbar">
                            {activeLang === 'python' ? (
                                <pre className="text-sm font-code whitespace-pre-wrap">
                                    {error ? <code className="text-red-500">{error}</code>
                                    : output ? <code className="text-gray-200">{output}</code>
                                    : <code className="text-gray-500 animate-pulse">{t('coding.awaitingExecution')}</code>}
                                </pre>
                            ) : (
                                <iframe ref={iframeRef} title="Web Preview" className="w-full h-full bg-white" sandbox="allow-scripts"></iframe>
                            )}
                        </div>
                    </div>
                </div>

                {/* Backdrop for mobile assistant overlay */}
                {isAssistantVisible && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setIsAssistantVisible(false)} />}
                
                {/* AI Assistant Panel - Combined for Mobile and Desktop */}
                <div className={`
                    ${isAssistantVisible ? 'translate-x-0' : 'translate-x-full'}
                    fixed top-0 right-0 h-full w-[90%] max-w-md bg-background border-l border-primary/20 z-40 transition-transform duration-300 ease-in-out
                    lg:static lg:h-auto lg:w-full lg:max-w-sm xl:max-w-md lg:translate-x-0 lg:border lg:rounded-lg lg:bg-black/30 lg:flex-shrink-0
                    flex flex-col min-h-0
                `}>
                     <div className="flex-shrink-0 p-2 border-b border-primary/20 bg-black/30 rounded-t-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CognitoLogo className="w-5 h-5"/>
                            <h2 className="font-code font-semibold text-primary/80 text-sm">{t('coding.assistantHeader')}</h2>
                        </div>
                        <button onClick={() => setIsAssistantVisible(false)} className="lg:hidden p-1 rounded-full hover:bg-input">
                          <XIcon className="w-5 h-5 text-text-medium" />
                        </button>
                    </div>
                    <div ref={assistantChatContainerRef} className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-4 min-h-0">
                        {chat?.messages.map((msg, index) => {
                             const isLastMessage = index === chat.messages.length - 1;
                             return (
                                 <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                     {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"><CodeBracketIcon className="w-4 h-4 text-primary" /></div>}
                                     <div className={`px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-accent1/20' : 'bg-input'} max-w-full overflow-x-auto`}>
                                        {msg.content ? (
                                            <MarkdownRenderer content={msg.content} onCopyCode={onCopyCode} />
                                        ) : (
                                            isLastMessage && isLoading && <PulsingDotsIndicator />
                                        )}
                                     </div>
                                 </div>
                             )
                        })}
                    </div>
                    <div className="flex-shrink-0 p-2 border-t border-primary/20">
                         <div className="flex items-center gap-2 p-1 bg-input rounded-lg border border-input-border focus-within:glow-border-active focus-within:border-primary transition-all duration-300">
                             <input type="text" value={assistantInput} onChange={e => setAssistantInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAssistantSend()} placeholder={t('coding.assistantPlaceholder')} className="flex-grow bg-transparent p-1 focus:outline-none text-sm"/>
                             <button onClick={handleAssistantSend} disabled={isLoading} className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-transform hover:scale-110 active:scale-95">
                                {isLoading ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-4 h-4" />}
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodingPlayground;