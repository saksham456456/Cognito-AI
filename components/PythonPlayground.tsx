
import React, { useState, useEffect, useRef } from 'react';
import PythonLoadingScreen from './PythonLoadingScreen';
import { MenuIcon } from './icons';

// TypeScript ko batane ke liye ki 'window' object pe 'loadPyodide' function मौजूद hoga.
declare global {
    interface Window {
        loadPyodide: (config: { indexURL: string }) => Promise<any>;
    }
}

interface PythonPlaygroundProps {
    onToggleSidebar: () => void; // Sidebar ko kholne/band karne ke liye function.
    initialCode: string | null; // Chat se code pass karne ke liye.
}

const PythonPlayground: React.FC<PythonPlaygroundProps> = ({ onToggleSidebar, initialCode }) => {
    // State variables
    const [code, setCode] = useState(`# The input() function does not work in this sandboxed environment.
# Assign values to variables directly to test logic.
a = 10
b = "*"
c = 5

print(f"Calculating: {a} {b} {c}")

if b=="+":
    print(a+c)
elif b=="-":
    print(a-c)
elif b=="*" or b=="x":
    print(a*c)
elif b=="/":
    print(a/c)
else:
    print("Invalid operator provided!")`);
    const [output, setOutput] = useState(''); // Code ka output store karne ke liye.
    const [error, setError] = useState(''); // Code ka error store karne ke liye.
    const [isPyodideLoading, setIsPyodideLoading] = useState(true); // Pyodide load ho raha hai ya nahi.
    const [showSplashScreen, setShowSplashScreen] = useState(true); // Shuruaati loading screen dikhana hai ya nahi.
    const [isExecuting, setIsExecuting] = useState(false); // Code abhi run ho raha hai ya nahi.
    
    // Pyodide instance ko store karne ke liye ref.
    const pyodideRef = useRef<any>(null);

    useEffect(() => {
        // Ek timer jo 5 seconds ke baad splash screen ko hata dega.
        const splashTimer = setTimeout(() => {
            setShowSplashScreen(false);
        }, 5000); 

        // Pyodide environment ko load karne wala asynchronous function.
        const loadPyodideEnvironment = async () => {
            try {
                if (window.loadPyodide) {
                    const pyodide = await window.loadPyodide({
                        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
                    });
                    await pyodide.loadPackage('numpy'); // numpy ko pehle se load kar lete hain.
                    pyodideRef.current = pyodide; // Pyodide instance ko ref me save karte hain.
                } else {
                    setError("Pyodide script has not loaded yet. Please refresh.");
                }
            } catch (err) {
                console.error('Pyodide loading error:', err);
                setError('Failed to load Python environment. Please check your network connection and try again.');
            } finally {
                setIsPyodideLoading(false); // Loading complete.
            }
        };
        
        loadPyodideEnvironment();

        // Cleanup: component unmount hone par timer clear karte hain.
        return () => clearTimeout(splashTimer);
    }, []);

    // Jab bhi initialCode prop badalta hai, editor ke code ko update karte hain.
    useEffect(() => {
        if (initialCode !== null) {
            setCode(initialCode);
        }
    }, [initialCode]);

    // Python code ko run karne wala function.
    const runCode = async () => {
        const pyodide = pyodideRef.current;
        if (!pyodide || isPyodideLoading) return;

        setIsExecuting(true);
        setOutput('');
        setError('');

        try {
            // Code me istemal hue imports ko load karte hain.
            await pyodide.loadPackagesFromImports(code);
            // Python ke standard output aur error ko redirect kar rahe hain taaki hum use capture kar sakein.
            pyodide.runPython(`
                import sys
                import io
                sys.stdout = io.StringIO()
                sys.stderr = io.StringIO()
            `);
            const result = await pyodide.runPythonAsync(code); // Code ko asynchronously run karte hain.
            const stdout = pyodide.runPython('sys.stdout.getvalue()'); // Output ko capture karte hain.
            const stderr = pyodide.runPython('sys.stderr.getvalue()'); // Error ko capture karte hain.

            if (stderr) {
                setError(stderr);
            } else {
                let finalOutput = stdout;
                // Agar code kuch return karta hai to use bhi output me dikhate hain.
                if (result !== undefined && result !== null) {
                    finalOutput += `\n<-- ${result}`;
                }
                setOutput(finalOutput.trim());
            }
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setIsExecuting(false);
        }
    };

    // Agar splash screen dikhana hai to use render karo.
    if (showSplashScreen) {
        return <PythonLoadingScreen />;
    }

    return (
        <div className="flex flex-col h-full bg-background crt-effect">
            <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-card-border/50 bg-background/80 relative">
                <button onClick={onToggleSidebar} className="p-1 rounded-md border border-transparent hover:border-card-border absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className="font-heading text-xl font-bold tracking-widest text-center text-primary uppercase" style={{textShadow: '0 0 5px var(--primary-glow)'}}>
                    Python Core
                </h1>
            </header>
            <div className="flex-1 flex flex-col md:flex-row gap-2 p-2 min-h-0">
                {/* Code Editor Section */}
                <div className="flex flex-col md:w-1/2 h-1/2 md:h-full">
                    <div className="flex items-center justify-between p-2 border-b border-primary/20 bg-black/30 rounded-t-lg">
                        <h2 className="font-code font-semibold text-primary/80 text-sm">/editor.py</h2>
                        <button
                            onClick={runCode}
                            disabled={isExecuting || isPyodideLoading}
                            className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-yellow-400 transition-colors border border-primary-foreground/20 text-sm font-bold disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                        >
                            {/* Button ka text loading/executing state ke hisab se badalta hai */}
                            {isPyodideLoading ? (
                                <>
                                 <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                 <span>INIT...</span>
                                </>
                            ) : isExecuting ? (
                                <>
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                <span>EXEC...</span>
                                </>
                            ) : (
                                'RUN >'
                            )}
                        </button>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 p-3 bg-black/50 border border-primary/20 rounded-b-lg text-green-400 focus:outline-none focus:border-primary/50 transition-colors resize-none font-code text-sm custom-scrollbar"
                        style={{textShadow: '0 0 2px #0f0a'}}
                        placeholder=">"
                        spellCheck="false"
                    />
                </div>

                {/* Output Console Section */}
                <div className="flex flex-col md:w-1/2 h-1/2 md:h-full">
                    <div className="p-2 border-b border-primary/20 bg-black/30 rounded-t-lg">
                        <h2 className="font-code font-semibold text-primary/80 text-sm">/console.log</h2>
                    </div>
                    <div className="flex-1 p-3 bg-black/50 border border-primary/20 rounded-b-lg overflow-y-auto custom-scrollbar">
                        <pre className="text-sm font-code whitespace-pre-wrap">
                            {error ? (
                                <code className="text-red-500">{`[ERROR] ${error}`}</code>
                            ) : output ? (
                                <code className="text-gray-200">{output}</code>
                            ) : (
                                <code className="text-gray-500 animate-pulse">
                                    [Awaiting execution...]
                                </code>
                            )}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PythonPlayground;
