import React, { useState, useEffect } from 'react';
import { CognitoLogo } from './Logo';

const disintegrationMessages = [
    "Terminating Python session...",
    "Releasing virtual resources...",
    "Cleaning up workspace...",
    "Switching back to chat mode...",
    "Done!",
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
                <linearGradient id="pythonDisintegrationGradient" x1="100%" y1="100%" x2="0%" y2="0%">
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
                stroke="url(#pythonDisintegrationGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 3.5s cubic-bezier(0.4, 0.2, 0, 1)' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
            />
        </svg>
    );
};

const PythonDisintegrationScreen: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Animate down to 0 after a brief delay to allow initial render at 100%
        const progressTimer = setTimeout(() => setProgress(0), 100);

        // Cycle through messages
        const messageInterval = setInterval(() => {
            setMessageIndex(prevIndex => {
                if (prevIndex < disintegrationMessages.length - 1) {
                    return prevIndex + 1;
                }
                return prevIndex;
            });
        }, 700);

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
                    <h1 className="text-2xl font-bold text-card-foreground dark:text-gray-100">Exiting Python Playground</h1>
                    <p className="text-card-foreground/70 dark:text-gray-400">Disintegrating environment from Cognito AI</p>
                </div>
                
                <div className="w-80 mt-2">
                    <p className="text-center text-sm text-card-foreground/60 dark:text-gray-500 mt-2 h-5 transition-opacity duration-300">
                       {disintegrationMessages[messageIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PythonDisintegrationScreen;
