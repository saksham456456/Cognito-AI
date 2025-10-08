
import React, { useState, useEffect } from 'react';
import { CognitoLogo } from './Logo';

// Python view se bahar aate waqt dikhne wale messages ka array.
const disintegrationMessages = [
    "Terminating Python session...",
    "Freeing virtual resources...",
    "Flushing memory caches...",
    "Disengaging Py-Core...",
    "Returning to primary interface.",
];

// Glitch effect ke sath text dikhane wala component.
const GlitchText = ({ text }: { text: string }) => {
    return (
        <div className="relative font-heading text-2xl font-bold text-text-light uppercase tracking-wider" style={{ textShadow: '0 0 5px var(--primary-glow)'}}>
            {/* Invisible span to give the container correct dimensions */}
            <span aria-hidden="true" className="opacity-0">{text}</span>
            {/* All three layers are now absolutely positioned to stack correctly */}
            <span className="absolute inset-0 animate-glitch opacity-80" style={{ animationDelay: '0.2s', clipPath: 'polygon(0 0, 100% 0, 100% 33%, 0 33%)' }}>{text}</span>
            <span className="absolute inset-0 animate-glitch opacity-80" style={{ clipPath: 'polygon(0 33%, 100% 33%, 100% 66%, 0 66%)' }}>{text}</span>
            <span className="absolute inset-0 animate-glitch opacity-80" style={{ animationDelay: '0.5s', clipPath: 'polygon(0 66%, 100% 66%, 100% 100%, 0 100%)' }}>{text}</span>
        </div>
    )
}

// Main Disintegration Screen component.
const PythonDisintegrationScreen: React.FC = () => {
    // Current message ka index track karne ke liye state.
    const [messageIndex, setMessageIndex] = useState(0);

    // useEffect se har 700ms me agla message dikhate hain.
    useEffect(() => {
        const messageInterval = setInterval(() => {
            setMessageIndex(prevIndex => {
                if (prevIndex < disintegrationMessages.length - 1) {
                    return prevIndex + 1;
                }
                return prevIndex; // Aakhri message pe ruk jao.
            });
        }, 700);

        // Cleanup: component unmount hone par interval ko clear karte hain.
        return () => {
            clearInterval(messageInterval);
        };
    }, []);

    return (
        // Full screen container with CRT effect.
        <div className="flex flex-col items-center justify-center h-full w-full bg-background crt-effect">
            <div className="flex flex-col items-center gap-8">
                 {/* Logo, halka sa faded dikhega */}
                 <div className="relative w-40 h-40 flex items-center justify-center">
                    <CognitoLogo className="w-20 h-20 opacity-50" />
                </div>

                {/* Header text with glitch effect */}
                <div className="text-center">
                    <GlitchText text="Disengaging Python Core" />
                    <p className="text-text-medium">Securely shutting down the environment...</p>
                </div>
                
                {/* Current status message */}
                <div className="w-80 mt-2">
                    <p className="font-code text-center text-sm text-text-dark mt-2 h-5 transition-opacity duration-300">
                       {disintegrationMessages[messageIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PythonDisintegrationScreen;