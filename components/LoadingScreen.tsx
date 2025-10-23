import React from 'react';

// A custom-animated logo specifically for the splash screen
const AnimatedCognitoLogo = () => {
    // Animation helper
    const anim = (name: string, delay: string, duration = '0.8s', easing = 'cubic-bezier(0.42, 0, 0.58, 1)') => ({
        animation: `${name} ${duration} ${easing} forwards`,
        animationDelay: delay,
        opacity: 0,
    });
    
    // Path drawing helper
    const draw = (length: number, delay: string, duration = '0.8s') => ({
        strokeDasharray: length,
        strokeDashoffset: length,
        animation: `draw-path ${duration} ease-out forwards`,
        animationDelay: delay,
    });

    return (
        <div className="relative w-40 h-40">
            <svg viewBox="0 0 160 160" className="w-full h-full" aria-label="Cognito Logo Assembly">
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
                {/* Central Core */}
                <circle 
                    cx="80" cy="80" r="10" 
                    fill="url(#goldGradient)"
                    style={anim('core-pulse-grow', '0.2s', '1.0s')}
                />
                
                {/* Main Body Parts */}
                <g stroke="url(#goldGradient)" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="55" y="40" width="50" height="40" rx="8" style={{ transformOrigin: '80px 80px', ...anim('materialize-from-center', '0.8s', '0.7s') }} />
                    <rect x="45" y="85" width="70" height="45" rx="8" style={{ transformOrigin: '80px 80px', ...anim('materialize-from-center', '1.0s', '0.7s') }} />

                    {/* Outer Arcs - Drawn in */}
                    <path d="M 30 25 A 50 50 0 0 1 130 25" style={draw(160, '1.5s', '1.2s')} />
                    <path d="M 30 135 A 50 50 0 0 0 130 135" transform="rotate(180, 80, 80)" style={draw(160, '1.5s', '1.2s')} />
                </g>

                {/* Appendages and Details */}
                <g stroke="url(#goldGradient)" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="70" cy="60" r="7" fill="url(#goldGradient)" stroke="none" style={anim('snap-in-place', '2.5s', '0.5s')} />
                    <circle cx="90" cy="60" r="7" fill="url(#goldGradient)" stroke="none" style={anim('snap-in-place', '2.5s', '0.5s')} />
                    <circle cx="50" cy="60" r="4" style={anim('snap-in-place', '2.7s', '0.5s')} />
                    <circle cx="110" cy="60" r="4" style={anim('snap-in-place', '2.7s', '0.5s')} />
                    <path d="M 45 95 Q 30 90, 30 105" style={anim('snap-in-place', '2.9s', '0.5s')} />
                    <path d="M 115 95 Q 130 90, 130 105" style={anim('snap-in-place', '2.9s', '0.5s')} />
                    <path d="M 60 130 L 60 140" style={anim('snap-in-place', '3.1s', '0.5s')} />
                    <path d="M 100 130 L 100 140" style={anim('snap-in-place', '3.1s', '0.5s')} />
                </g>
            </svg>
        </div>
    );
};

const LoadingScreen = ({ t }: { t: (key: string, fallback?: any) => any }) => {
    const bootLogMessages: string[] = t('loading.bootLog', []);
    
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-background overflow-hidden splash-sequence crt-effect">
            <div className="splash-grid-bg"></div>
            <div className="relative flex flex-col items-center justify-center z-10">
                <AnimatedCognitoLogo />
                <h1 className="font-heading text-5xl font-bold tracking-[0.2em] text-primary mt-4 opacity-0 animate-neon-flicker" style={{ animationDelay: '4.0s' }}>
                    Cognito AI
                </h1>
                <div className="font-code text-sm text-text-medium mt-8 w-96 h-28 p-2 text-left">
                    {Array.isArray(bootLogMessages) && bootLogMessages.map((msg, i) => (
                        <p key={i} className="opacity-0 fade-in-up" style={{ animationDelay: `${4.2 + i * 0.15}s` }}>
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