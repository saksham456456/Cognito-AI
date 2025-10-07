import React, { useState, useEffect, useRef } from 'react';
import { CodeBracketIcon } from './icons';

declare global {
    interface Window {
        loadPyodide: (config: { indexURL: string }) => Promise<any>;
    }
}

const PythonPlayground: React.FC = () => {
    const [code, setCode] = useState('print("Hello, Python!")');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [isPyodideLoading, setIsPyodideLoading] = useState(true);
    const [isExecuting, setIsExecuting] = useState(false);
    const pyodideRef = useRef<any>(null);

    useEffect(() => {
        const loadPyodide = async () => {
            try {
                if (window.loadPyodide) {
                    const pyodide = await window.loadPyodide({
                        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/',
                    });
                    pyodideRef.current = pyodide;
                    setIsPyodideLoading(false);
                } else {
                    setError("Pyodide script not loaded yet. Please refresh.");
                }
            } catch (err) {
                console.error('Pyodide loading error:', err);
                setError('Failed to load Python environment. Please check your network connection and try again.');
                setIsPyodideLoading(false);
            }
        };
        loadPyodide();
    }, []);

    const runCode = async () => {
        const pyodide = pyodideRef.current;
        if (!pyodide) return;

        setIsExecuting(true);
        setOutput('');
        setError('');

        try {
            await pyodide.loadPackagesFromImports(code);
            pyodide.runPython(`
                import sys
                import io
                sys.stdout = io.StringIO()
                sys.stderr = io.StringIO()
            `);
            const result = await pyodide.runPythonAsync(code);
            const stdout = pyodide.runPython('sys.stdout.getvalue()');
            const stderr = pyodide.runPython('sys.stderr.getvalue()');

            if (stderr) {
                setError(stderr);
            } else {
                let finalOutput = stdout;
                if (result !== undefined) {
                    finalOutput += `\n---> ${result}`;
                }
                setOutput(finalOutput.trim());
            }
        } catch (err: any) {
            setError(err.toString());
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background dark:bg-[#141414]">
            <header className="flex items-center justify-center p-4 border-b border-card-border dark:border-zinc-800 relative">
                <h1 className="text-xl font-semibold tracking-wider text-center text-primary dark:text-yellow-400 text-outline">
                    Python Playground
                </h1>
            </header>
            <div className="flex-1 flex flex-col md:flex-row gap-2 p-2 min-h-0">
                {/* Code Editor */}
                <div className="flex flex-col md:w-1/2 h-1/2 md:h-full">
                    <div className="flex items-center justify-between p-2 bg-card dark:bg-[#1f1f1f] border-b border-card-border dark:border-zinc-800 rounded-t-lg">
                        <h2 className="font-semibold text-card-foreground/80 dark:text-gray-300">Editor</h2>
                        <button
                            onClick={runCode}
                            disabled={isPyodideLoading || isExecuting}
                            className="px-4 py-1.5 rounded-lg bg-primary dark:bg-yellow-400 text-primary-foreground dark:text-black hover:bg-yellow-400 dark:hover:bg-yellow-300 transition-colors border border-primary-foreground/20 dark:border-transparent text-sm font-bold disabled:opacity-50 disabled:cursor-wait flex items-center gap-2"
                        >
                            {isExecuting ? (
                                <>
                                <div className="w-4 h-4 border-2 border-primary-foreground dark:border-black border-t-transparent rounded-full animate-spin"></div>
                                <span>Running...</span>
                                </>
                            ) : (
                                'Run Code'
                            )}
                        </button>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 p-3 bg-input dark:bg-[#292929] border border-input-border dark:border-zinc-700 rounded-b-lg text-card-foreground dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-yellow-400 transition-colors resize-none font-mono text-sm custom-scrollbar"
                        placeholder="Enter Python code here..."
                        spellCheck="false"
                    />
                </div>

                {/* Output Console */}
                <div className="flex flex-col md:w-1/2 h-1/2 md:h-full">
                    <div className="p-2 bg-card dark:bg-[#1f1f1f] border-b border-card-border dark:border-zinc-800 rounded-t-lg">
                        <h2 className="font-semibold text-card-foreground/80 dark:text-gray-300">Console</h2>
                    </div>
                    <div className="flex-1 p-3 bg-input dark:bg-[#292929] border border-input-border dark:border-zinc-700 rounded-b-lg overflow-y-auto custom-scrollbar">
                        {isPyodideLoading ? (
                            <div className="flex items-center gap-2 text-card-foreground/60 dark:text-gray-400">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                <span>Initializing Python environment...</span>
                            </div>
                        ) : (
                            <pre className="text-sm font-mono whitespace-pre-wrap">
                                {error ? (
                                    <code className="text-red-500">{error}</code>
                                ) : output ? (
                                    <code className="text-card-foreground dark:text-gray-200">{output}</code>
                                ) : (
                                    <code className="text-card-foreground/50 dark:text-gray-500">
                                        Click "Run Code" to see the output here.
                                    </code>
                                )}
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PythonPlayground;
