import React, { useState, useEffect } from 'react';
import { CognitoLogo } from './Logo';

const loadingMessages = [
    "Initializing Pyodide runtime...",
    "Connecting to CDN...",
    "Downloading Python environment...",
    "Unpacking core packages...",
    "Setting up virtual file system...",
    "Compiling standard library modules...",
    "Finalizing setup...",
    "Integration complete!",
];

const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 54;
    const stroke = 6;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <svg
            height={radius * 2}
            width={radius * 2}
            viewBox={`0 0 ${radius * 2} ${radius * 2}`}
            className="-rotate-90"
        >
            <defs>
                <linearGradient id="pythonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#387EB8" /> 
                    <stop offset="100%" stopColor="#FFD43B" />
                </linearGradient>
            </defs>
            <circle
                stroke="hsl(0 0% 90% / 0.1)"
                className="dark:stroke-zinc-800"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
            <circle
                stroke="url(#pythonGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 4.5s cubic-bezier(0.4, 0.2, 0, 1)' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
            />
        </svg>
    );
};


const PythonLoadingScreen: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Trigger the animation to start after a brief delay
        const progressTimer = setTimeout(() => setProgress(100), 100);

        // Cycle through loading messages during the animation
        const messageInterval = setInterval(() => {
            setMessageIndex(prevIndex => {
                if (prevIndex < loadingMessages.length - 1) {
                    return prevIndex + 1;
                }
                return prevIndex;
            });
        }, 600); // 4800ms total for messages, fitting within the 5s window

        return () => {
            clearTimeout(progressTimer);
            clearInterval(messageInterval);
        };
    }, []);


    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-background dark:bg-[#141414] text-card-foreground dark:text-gray-300">
            <div className="flex flex-col items-center gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0">
                        <CircularProgress progress={progress} />
                    </div>
                    <CognitoLogo className="w-16 h-16" />
                </div>

                <div className="text-center">
                    <h1 className="text-2xl font-bold text-card-foreground dark:text-gray-100">Preparing Python Playground</h1>
                    <p className="text-card-foreground/70 dark:text-gray-400">Installing environment inside Cognito AI</p>
                </div>
                
                <div className="w-80 mt-2">
                    <p className="text-center text-sm text-card-foreground/60 dark:text-gray-500 mt-2 h-5 transition-opacity duration-300">
                       {loadingMessages[messageIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PythonLoadingScreen;