

import React from 'react';

// Cognito ka main SVG logo component.
export const CognitoLogo = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cognito Logo"
    >
      <defs>
        {/* Sone jaisa gradient (gold color gradient) define kar rahe hain */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(50, 100%, 75%)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(45, 90%, 50%)', stopOpacity: 1 }} />
        </linearGradient>
        {/* Glow effect ke liye SVG filter define kar rahe hain */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* CSS animation ko style tag ke andar define kar rahe hain */}
        <style>
          {`
            .logo-pulse {
                /* Animation ka naam, duration, aur timing function */
                animation: logo-pulse-animation 3s infinite ease-in-out;
            }
            @keyframes logo-pulse-animation {
                /* Animation ke keyframes: halka sa scale aur opacity change hota hai */
                0%, 100% { opacity: 0.8; transform: scale(0.98); }
                50% { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
      </defs>
      {/* Logo ke saare parts ko ek group <g> me rakha hai */}
      <g className="logo-graphic logo-pulse" stroke="url(#goldGradient)" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Arcs - Bahar ke do arcs */}
        <path d="M 30 25 A 50 50 0 0 1 130 25" />
        <path d="M 30 135 A 50 50 0 0 0 130 135" transform="rotate(180, 80, 80)" />

        {/* Head - Robot ka sir */}
        <rect x="55" y="40" width="50" height="40" rx="8" />
        {/* Eyes - Aankhein */}
        <circle cx="70" cy="60" r="7" fill="url(#goldGradient)" stroke="none" />
        <circle cx="90" cy="60" r="7" fill="url(#goldGradient)" stroke="none" />
        {/* Head Antennae/Ears - Sir ke antenna/kaan */}
        <circle cx="50" cy="60" r="4" />
        <circle cx="110" cy="60" r="4" />

        {/* Body - Dhad */}
        <rect x="45" y="85" width="70" height="45" rx="8" />
        
        {/* Arms - Haath */}
        <path d="M 45 95 Q 30 90, 30 105" />
        <path d="M 115 95 Q 130 90, 130 105" />
        {/* Hands - Panje */}
        <path d="M 28 103 L 32 107 M 28 107 L 32 103" />
        <path d="M 128 103 L 132 107 M 128 107 L 132 103" />

        {/* Legs - Paer */}
        <path d="M 60 130 L 60 140" />
        <path d="M 100 130 L 100 140" />
      </g>
    </svg>
  );
};

// Logo ke sath text (COGNITO) dikhane wala component.
export const CognitoLogoText = ({ className }: { className?: string }) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
        {/* Upar wala CognitoLogo component use kar rahe hain */}
        <CognitoLogo className="h-16 w-16" />
        {/* App ka naam */}
        <h1 className="font-heading text-2xl font-bold tracking-widest text-primary mt-2" style={{ textShadow: '0 0 8px hsl(45 90% 60% / 0.5)'}}>COGNITO</h1>
        {/* Tagline */}
        <p className="text-text-medium text-sm">Your Personal AI Assistant</p>
    </div>
  )
}