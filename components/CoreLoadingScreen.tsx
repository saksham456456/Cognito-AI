import React, { useState, useEffect } from 'react';

// New SVG for the booting core
const CoreBootIcon = () => {
    // NEW: State to trigger the drawing animation via style transitions.
    const [isDrawing, setIsDrawing] = useState(false);

    // This effect triggers the drawing animation after a short delay.
    useEffect(() => {
        const timer = setTimeout(() => setIsDrawing(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // NEW: Helper function to generate transition styles for SVG drawing.
    const getDrawStyle = (length: number, duration: string, delay: string) => ({
        strokeDasharray: length,
        strokeDashoffset: isDrawing ? 0 : length,
        transition: `stroke-dashoffset ${duration} cubic-bezier(0.42, 0, 0.58, 1) ${delay}`,
    });
    
    return (
        <svg viewBox="0 0 200 200" className="w-40 h-40">
            <defs>
                <filter id="core-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g fill="none" stroke="hsl(48, 100%, 55%)" strokeWidth="2" filter="url(#core-glow)">
                {/* Concentric pulsing circles */}
                <circle cx="100" cy="100" r="40" className="core-svg-pulse" strokeOpacity="0.8" style={{ animationDelay: '2s' }} />
                <circle cx="100" cy="100" r="60" className="core-svg-pulse" strokeOpacity="0.5" style={{ animationDelay: '2.2s' }} />
                
                {/* Main drawing elements using style transitions */}
                <circle cx="100" cy="100" r="80" style={getDrawStyle(503, '1.5s', '0.4s')} />
                
                <path d="M 100 20 V 50" style={getDrawStyle(30, '0.5s', '0.8s')} />
                <path d="M 100 180 V 150" style={getDrawStyle(30, '0.5s', '0.8s')} />
                <path d="M 20 100 H 50" style={getDrawStyle(30, '0.5s', '0.8s')} />
                <path d="M 180 100 H 150" style={getDrawStyle(30, '0.5s', '0.8s')} />
                
                <path d="M 55 55 L 75 75" style={getDrawStyle(29, '0.5s', '1.0s')} />
                <path d="M 145 145 L 125 125" style={getDrawStyle(29, '0.5s', '1.0s')} />
                <path d="M 55 145 L 75 125" style={getDrawStyle(29, '0.5s', '1.0s')} />
                <path d="M 145 55 L 125 75" style={getDrawStyle(29, '0.5s', '1.0s')} />

                {/* Inner rotating element */}
                <rect 
                    x="85" y="85" width="30" height="30" rx="4" 
                    stroke="hsl(220, 100%, 65%)" 
                    style={{ 
                        ...getDrawStyle(120, '1s', '1.2s'), 
                        transformOrigin: 'center center', 
                        animation: 'spin 4s linear infinite 1.5s' 
                    }} 
                />
            </g>
        </svg>
    );
};


const CoreLoadingScreen: React.FC<{ show: boolean, t: (key: string, fallback?: any) => any }> = ({ show, t }) => {
    const [visibleLogLines, setVisibleLogLines] = useState(0);
    const bootLogMessages: string[] = t('coreLoading.bootLog', []);

    // This effect reveals the log lines one by one.
    useEffect(() => {
        if (!show) {
            setVisibleLogLines(0);
            return;
        }

        const timers: number[] = [];
        // Start showing log lines after an initial delay
        const initialDelay = 1400;
        const lineInterval = 150;

        bootLogMessages.forEach((_, index) => {
            const timer = window.setTimeout(() => {
                setVisibleLogLines(prev => prev + 1);
            }, initialDelay + index * lineInterval);
            timers.push(timer);
        });

        // Cleanup function to clear timeouts if the component unmounts.
        return () => {
            timers.forEach(clearTimeout);
        };
    }, [show, bootLogMessages]);

    if (!show) return null;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center h-full w-full bg-background crt-effect overflow-hidden z-40 core-boot-up">
            {/* Faint grid in the background */}
            <div className="boot-grid" style={{ animationDelay: '0.2s' }} />
            
            <div className="flex flex-col items-center gap-6 z-10">
                {/* Animated Core SVG */}
                <CoreBootIcon />
                
                {/* Header text with typing animation */}
                <div className="text-center">
                    <h1 className="font-heading text-2xl font-bold text-text-light uppercase tracking-wider typing-effect" style={{ animationDelay: '1s' }}>
                        {t('coreLoading.title')}
                    </h1>
                </div>
                
                {/* Boot log */}
                <div className="w-96 h-48 bg-black/30 border border-primary/20 rounded-md p-4 font-code text-sm text-green-400 opacity-0 fade-in-up" style={{ animationDelay: '1.2s' }}>
                    {Array.isArray(bootLogMessages) && bootLogMessages.slice(0, visibleLogLines).map((msg, i) => (
                        <p key={i} className="boot-log-line" style={{ animationDelay: `${i * 50}ms` }}>
                            {msg}
                            {/* Show blinking cursor only on the last visible line */}
                            {i === visibleLogLines - 1 && i < bootLogMessages.length - 1 && (
                                <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-cursor-blink" />
                            )}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoreLoadingScreen;