import React, { useMemo } from 'react';
import { PythonLogoIcon } from './icons';

// Loading ke time dikhne wale messages ka array.
const loadingMessages = [
    "Reticulating splines...",
    "Initializing Pyodide runtime...",
    "Establishing secure CDN link...",
    "Decompressing Python core...",
    "Calibrating standard libraries...",
    "Mounting virtual file system...",
    "Compiling dependencies...",
    "Finalizing environment...",
    "Integration complete. Standby.",
];

// Data stream particle effect component.
const DataStream = () => {
    // useMemo ensures the particles are only generated once.
    const particles = useMemo(() => {
        const particleArray = [];
        const count = 100; // Number of particles
        for (let i = 0; i < count; i++) {
            const isHorizontal = Math.random() > 0.5;
            const style = {
                '--duration': `${Math.random() * 2 + 2}s`, // 2s to 4s
                '--delay': `${Math.random() * 2}s`, // 0s to 2s
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `var(--duration) var(--delay) infinite linear`,
                animationName: isHorizontal ? 'data-stream-x' : 'data-stream-y',
            };
            particleArray.push(
                <div 
                    key={i} 
                    className={`absolute w-0.5 h-0.5 rounded-full bg-primary/80`} 
                    style={style as React.CSSProperties} 
                />
            );
        }
        return particleArray;
    }, []);

    return <div className="absolute inset-0 z-0">{particles}</div>;
};

// Main Python Loading Screen component.
const PythonLoadingScreen: React.FC = () => {
    return (
        // Full screen container with a relative position for particle placement.
        <div className="flex flex-col items-center justify-center h-full w-full bg-background crt-effect relative overflow-hidden">
            <DataStream />
            <div className="flex flex-col items-center gap-8 z-10">
                {/* Logo with pulsing animation */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
                    <PythonLogoIcon className="w-24 h-24 opacity-0 fade-in-up" style={{animationDelay: '0.5s'}}/>
                </div>
                
                {/* Header text */}
                <div className="text-center opacity-0 fade-in-up" style={{animationDelay: '0.8s'}}>
                    <h1 className="font-heading text-2xl font-bold text-text-light uppercase tracking-wider">
                        Engaging Python Core
                    </h1>
                </div>
                
                {/* Status text cycler */}
                <div className="w-80 h-6 overflow-hidden opacity-0 fade-in-up" style={{animationDelay: '1.2s'}}>
                    <div className="animate-status-cycle">
                        {loadingMessages.map((msg, i) => (
                             <p key={i} className="font-code text-center text-sm text-text-medium h-6">
                                {msg}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PythonLoadingScreen;
