import React from 'react';

const bootLogMessages = [
    "[INITIATING] COGNITO OS v2.1",
    "[LOADING]    PERSONALITY_MATRIX.DAT",
    "[CALIBRATING] HEURISTIC_PROCESSORS",
    "[ESTABLISHING] SECURE_CHANNEL_TO_USER",
    "[STATUS]     ALL SYSTEMS NOMINAL.",
];

// A custom-animated logo specifically for the splash screen
const AnimatedCognitoLogo = () => {
    const anim = (name: string, delay: string, duration = '0.8s') => ({
        animation: `${name} ${duration} cubic-bezier(0.42, 0, 0.58, 1) forwards`,
        animationDelay: delay,
        opacity: 0,
    });

    return (
        <div className="relative w-40 h-40">
            <svg viewBox="0 0 160 160" className="w-full h-full" aria-label="Cognito Logo">
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
                <g stroke="url(#goldGradient)" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    {/* Animate each part */}
                    <path d="M 30 25 A 50 50 0 0 1 130 25" style={anim('fly-in-top', '0.5s')} />
                    <path d="M 30 135 A 50 50 0 0 0 130 135" transform="rotate(180, 80, 80)" style={anim('fly-in-bottom', '0.5s')} />
                    
                    <rect x="55" y="40" width="50" height="40" rx="8" style={anim('zoom-in-fade', '0.8s')} />
                    <rect x="45" y="85" width="70" height="45" rx="8" style={anim('zoom-in-fade', '0.9s')} />
                    
                    <circle cx="70" cy="60" r="7" fill="url(#goldGradient)" stroke="none" style={anim('zoom-in-fade', '1.2s')} />
                    <circle cx="90" cy="60" r="7" fill="url(#goldGradient)" stroke="none" style={anim('zoom-in-fade', '1.2s')} />

                    <path d="M 45 95 Q 30 90, 30 105" style={anim('fly-in-left', '1.0s')} />
                    <path d="M 115 95 Q 130 90, 130 105" style={anim('fly-in-right', '1.0s')} />

                    <path d="M 60 130 L 60 140" style={anim('fly-in-bottom', '1.1s')} />
                    <path d="M 100 130 L 100 140" style={anim('fly-in-bottom', '1.1s')} />
                </g>
            </svg>
            {/* Flash effect element */}
            <div 
                className="absolute inset-0 m-auto w-1 h-1 rounded-full bg-primary" 
                style={{ ...anim('flash-effect', '1.8s', '0.4s'), animationTimingFunction: 'ease-out' }}
            ></div>
        </div>
    );
};

const LoadingScreen = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-background overflow-hidden splash-sequence crt-effect">
            <div className="splash-grid-bg"></div>
            <div className="relative flex flex-col items-center justify-center z-10">
                <AnimatedCognitoLogo />
                <h1 className="font-heading text-4xl font-bold tracking-[0.3em] text-primary mt-4 opacity-0 fade-in-up" style={{ animationDelay: '2.0s' }}>
                    COGNITO
                </h1>
                <div className="font-code text-sm text-text-medium mt-8 w-96 h-28 p-2 text-left">
                    {bootLogMessages.map((msg, i) => (
                        <p key={i} className="opacity-0 fade-in-up" style={{ animationDelay: `${2.2 + i * 0.15}s` }}>
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