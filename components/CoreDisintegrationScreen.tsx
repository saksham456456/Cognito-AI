import React from 'react';

interface CoreDisintegrationScreenProps {
    children: React.ReactNode;
    show: boolean;
}

// Main Disintegration Screen component for exiting the Coding Core.
const CoreDisintegrationScreen: React.FC<CoreDisintegrationScreenProps> = ({ children, show }) => {
    // This component is designed to be active for its animation duration.
    if (!show) {
        return null;
    }

    return (
        // Full screen container with CRT effect.
        <div className="h-full w-full bg-background crt-effect relative overflow-hidden">
            {/* 1. Main content that glitches */}
            <div 
                className="h-full w-full animate-core-glitch"
                style={{
                    animationDuration: '0.5s',
                    animationFillMode: 'forwards',
                }}
            >
                {/* 2. Content fades out during the glitch */}
                <div 
                    className="h-full w-full animate-fade-out-fast"
                    style={{
                        animationDuration: '0.7s',
                        animationFillMode: 'forwards',
                        animationDelay: '0.2s',
                    }}
                >
                    {children}
                </div>
            </div>
             {/* 3. Screen wipe effect that plays over the top */}
            <div 
                className="absolute inset-0 z-10 bg-background animate-screen-off-wipe" 
                style={{
                    animationDelay: '0.5s',
                    animationFillMode: 'forwards',
                }}
            />
        </div>
    );
};

export default CoreDisintegrationScreen;