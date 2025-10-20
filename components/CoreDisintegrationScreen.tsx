import React, { useState, useEffect } from 'react';
import { PowerIcon } from './icons';

const CoreDisintegrationScreen: React.FC<{ show: boolean, t: (key: string, fallback?: any) => any }> = ({ show, t }) => {
    const [visibleLogLines, setVisibleLogLines] = useState(0);
    const shutdownLogMessages: string[] = t('coreDisintegration.shutdownLog', []);

    // This effect reveals the log lines one by one during the shutdown sequence.
    useEffect(() => {
        if (!show) {
            setVisibleLogLines(0);
            return;
        }

        const timers: number[] = [];
        const initialDelay = 500; // Start showing logs sooner
        const lineInterval = 150;

        shutdownLogMessages.forEach((_, index) => {
            const timer = window.setTimeout(() => {
                setVisibleLogLines(prev => prev + 1);
            }, initialDelay + index * lineInterval);
            timers.push(timer);
        });

        // Cleanup function to clear timeouts
        return () => {
            timers.forEach(clearTimeout);
        };
    }, [show, shutdownLogMessages]);

    if (!show) return null;

    return (
        // This is now a full-screen overlay that plays its own animation.
        <div className="absolute inset-0 flex flex-col items-center justify-center h-full w-full bg-background crt-effect z-50 core-shutdown-screen">
            <div className="flex flex-col items-center gap-6 z-10">
                {/* Pulsing power icon */}
                <PowerIcon className="w-24 h-24 text-primary shutdown-icon-pulse" />
                
                {/* Header text */}
                <div className="text-center opacity-0 fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h1 className="font-heading text-2xl font-bold text-text-light uppercase tracking-wider">
                        {t('coreDisintegration.title')}
                    </h1>
                </div>
                
                {/* Shutdown log */}
                <div className="w-96 h-48 bg-black/30 border border-primary/20 rounded-md p-4 font-code text-sm text-red-400 opacity-0 fade-in-up" style={{ animationDelay: '0.4s' }}>
                    {Array.isArray(shutdownLogMessages) && shutdownLogMessages.slice(0, visibleLogLines).map((msg, i) => (
                        <p key={i} className="shutdown-log-line" style={{ animationDelay: `${i * 50}ms` }}>
                            {msg}
                             {/* Show blinking cursor only on the last visible line */}
                            {i === visibleLogLines - 1 && i < shutdownLogMessages.length - 1 && (
                                <span className="inline-block w-2 h-4 bg-red-400 ml-1 animate-cursor-blink" />
                            )}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoreDisintegrationScreen;