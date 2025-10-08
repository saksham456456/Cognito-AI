
import React, { useState, useEffect } from 'react';
import { CognitoLogo } from './Logo';

// Loading ke time dikhne wale messages ka array.
const loadingMessages = [
    "Initializing Pyodide runtime...",
    "Establishing secure CDN link...",
    "Decompressing Python core...",
    "Calibrating standard libraries...",
    "Mounting virtual file system...",
    "Compiling dependencies...",
    "Finalizing environment...",
    "Integration complete. Standby.",
];

// Circular progress bar component.
const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 60; // Circle ka radius.
    const stroke = 4; // Border ki motai.
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI; // Circle ka ghera.
    // Progress ke hisab se kitna border dikhana hai.
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg
            height={radius * 2}
            width={radius * 2}
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className="-rotate-90" // 12 baje se shuru karne ke liye.
        >
            <defs>
                {/* Python logo ke colors ka gradient */}
                <linearGradient id="pythonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#387EB8" /> 
                    <stop offset="100%" stopColor="#FFD43B" />
                </linearGradient>
                {/* Progress bar pe glow effect */}
                <filter id="progressGlow">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {/* Background circle (halka sa) */}
            <circle
                stroke="hsla(220, 100%, 65%, 0.1)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            {/* Foreground progress circle (jo animate hota hai) */}
            <circle
                stroke="url(#pythonGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 4.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
                filter="url(#progressGlow)"
            />
        </svg>
    );
};

// Main Python Loading Screen component.
const PythonLoadingScreen: React.FC = () => {
    // State to track which loading message to show.
    // Kaunsa loading message dikhana hai, uska index.
    const [messageIndex, setMessageIndex] = useState(0);
    // State to track the progress of the circular bar.
    // Progress bar ka percentage.
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Component mount hone par progress bar ko 100% tak animate karna shuru karte hain.
        const progressTimer = setTimeout(() => setProgress(100), 100);

        // Har 550ms me agla loading message dikhate hain.
        const messageInterval = setInterval(() => {
            setMessageIndex(prevIndex => {
                if (prevIndex < loadingMessages.length - 1) {
                    return prevIndex + 1;
                }
                return prevIndex; // Aakhri message pe ruk jao.
            });
        }, 550); 

        // Cleanup: component unmount hone par timers aur intervals ko clear karte hain.
        return () => {
            clearTimeout(progressTimer);
            clearInterval(messageInterval);
        };
    }, []);


    return (
        // Full screen container with CRT effect.
        <div className="flex flex-col items-center justify-center h-full w-full bg-background crt-effect">
            <div className="flex flex-col items-center gap-8">
                {/* Progress bar aur logo ka container */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    <div className="absolute inset-0">
                        <CircularProgress progress={progress} />
                    </div>
                    <CognitoLogo className="w-20 h-20" />
                </div>

                {/* Header text */}
                <div className="text-center">
                    <h1 className="font-heading text-2xl font-bold text-text-light uppercase tracking-wider" style={{ textShadow: '0 0 5px var(--primary-glow)'}}>Engaging Python Core</h1>
                    <p className="text-text-medium">Please wait while the environment initializes...</p>
                </div>
                
                {/* Current loading message */}
                <div className="w-80 mt-2">
                    <p className="font-code text-center text-sm text-text-dark mt-2 h-5 transition-opacity duration-300">
                       {loadingMessages[messageIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PythonLoadingScreen;