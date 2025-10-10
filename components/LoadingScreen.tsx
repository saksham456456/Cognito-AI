import React, { useEffect, useState, useMemo } from 'react';

const bootLogMessages = [
    "[INITIATING] COGNITO OS v2.1",
    "[LOADING]    PERSONALITY_MATRIX.DAT",
    "[CALIBRATING] HEURISTIC_PROCESSORS",
    "[ESTABLISHING] SECURE_CHANNEL_TO_USER",
    "[STATUS]     ALL SYSTEMS NOMINAL.",
];

// A custom-animated logo specifically for the splash screen
const AnimatedCognitoLogo = () => {
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsDrawing(true), 200);
        return () => clearTimeout(timer);
    }, []);

    // Helper to create smooth drawing transitions
    const getDrawStyle = (length: number, duration: string, delay: string) => ({
        strokeDasharray: length,
        strokeDashoffset: isDrawing ? 0 : length,
        transition: `stroke-dashoffset ${duration} ease-in-out ${delay}`,
    });
    
    // Helper for fade-in transitions
    const getFadeStyle = (delay: string) => ({
        opacity: isDrawing ? 1 : 0,
        transition: `opacity 0.5s ease-in ${delay}`,
    });

    return (
        <svg viewBox="0 0 160 160" className="w-24 h-24" aria-label="Cognito Logo">
            <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'hsl(50, 100%, 75%)' }} />
                    <stop offset="100%" style={{ stopColor: 'hsl(45, 90%, 50%)' }} />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g stroke="url(#goldGradient)" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)">
                {/* Paths are now animated individually */}
                <path d="M 30 25 A 50 50 0 0 1 130 25" style={getDrawStyle(157, '1s', '0.2s')} />
                <path d="M 30 135 A 50 50 0 0 0 130 135" transform="rotate(180, 80, 80)" style={getDrawStyle(157, '1s', '0.2s')} />
                <rect x="55" y="40" width="50" height="40" rx="8" style={{ ...getDrawStyle(180, '0.8s', '0.6s'), ...getFadeStyle('0.6s') }} />
                <rect x="45" y="85" width="70" height="45" rx="8" style={{ ...getDrawStyle(230, '0.8s', '0.8s'), ...getFadeStyle('0.8s') }} />
                <circle cx="70" cy="60" r="7" fill="url(#goldGradient)" stroke="none" style={getFadeStyle('1.2s')} />
                <circle cx="90" cy="60" r="7" fill="url(#goldGradient)" stroke="none" style={getFadeStyle('1.2s')} />
                <path d="M 60 130 L 60 140" style={getDrawStyle(10, '0.3s', '1.4s')} />
                <path d="M 100 130 L 100 140" style={getDrawStyle(10, '0.3s', '1.4s')} />
            </g>
        </svg>
    );
};

const LoadingScreen = () => {
    // Generate the characters for the data cascade effect only once.
    const cascadeChars = useMemo(() => {
        const chars = '01';
        let content = '';
        for (let i = 0; i < 2000; i++) {
            content += chars[Math.floor(Math.random() * chars.length)];
        }
        return content;
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-background overflow-hidden splash-sequence crt-effect">
            <div className="absolute inset-0 font-mono text-primary text-xs leading-none whitespace-pre data-cascade" style={{ animationDelay: '0.2s' }}>
                {cascadeChars}
            </div>
            <div className="relative flex flex-col items-center justify-center z-10">
                <AnimatedCognitoLogo />
                <h1 className="font-heading text-4xl font-bold tracking-[0.3em] text-primary mt-4 opacity-0 fade-in-up" style={{ animationDelay: '1.5s' }}>
                    COGNITO
                </h1>
                <div className="font-code text-sm text-text-medium mt-8 w-96 h-28 p-2 text-left">
                    {bootLogMessages.map((msg, i) => (
                        <p key={i} className="opacity-0 fade-in-up" style={{ animationDelay: `${1.7 + i * 0.2}s` }}>
                            <span className="text-primary">{msg.substring(0, msg.indexOf(']') + 1)}</span>
                            <span className="text-text-light">{msg.substring(msg.indexOf(']') + 1)}</span>
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;