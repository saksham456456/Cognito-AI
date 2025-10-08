import React, { useEffect, useState } from 'react';
import { CognitoLogo } from './Logo';

const LoadingScreen = () => {
    // State to control the visibility of SVG paths for the drawing animation.
    const [pathsVisible, setPathsVisible] = useState(false);

    // 100ms after the component mounts, make the paths visible to start the animation.
    useEffect(() => {
        const timer = setTimeout(() => setPathsVisible(true), 100);
        return () => clearTimeout(timer); // Cleanup
    }, []);
    
    // This function generates dynamic styles for the SVG path.
    // The line drawing effect is created with 'stroke-dasharray' and 'stroke-dashoffset'.
    const pathStyle = (length: number, delay: string) => ({
        strokeDasharray: length, // The total length of the path.
        strokeDashoffset: pathsVisible ? 0 : length, // When `pathsVisible` is true, the offset becomes 0, making the line appear.
        transition: `stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)`, // Animation duration and timing function.
        transitionDelay: delay // Delay before the animation starts.
    });

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-background">
      <div className="flex flex-col items-center space-y-6">
         <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG container for the neural network path animations */}
            <svg viewBox="0 0 200 200" className="absolute w-full h-full">
                <defs>
                    {/* Glow filter definition */}
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                <g stroke="hsl(48, 100%, 55%)" fill="none" strokeWidth="1" filter="url(#glow)">
                    {/* Different neural network paths, each with its own style (length, delay) */}
                    <path d="M 20,100 C 50,20 150,20 180,100" style={pathStyle(275, '0s')} />
                    <path d="M 20,100 C 50,180 150,180 180,100" style={pathStyle(275, '0s')} />
                    <path d="M 100,20 C 20,50 20,150 100,180" style={pathStyle(275, '0.2s')} />
                    <path d="M 100,20 C 180,50 180,150 100,180" style={pathStyle(275, '0.2s')} />
                    <path d="M 40,40 C 100,80 100,120 40,160" style={pathStyle(170, '0.4s')} />
                    <path d="M 160,40 C 100,80 100,120 160,160" style={pathStyle(170, '0.4s')} />
                </g>
            </svg>
            {/* Fade in the logo slightly after the path animation */}
            <div className={`transition-opacity duration-1000 delay-1000 ${pathsVisible ? 'opacity-100' : 'opacity-0'}`}>
                <CognitoLogo className="h-24 w-24" />
            </div>
         </div>
         {/* App name with text-glow animation */}
        <h1 className="font-heading text-4xl font-bold tracking-[0.3em] text-primary animate-text-glow">
            COGNITO
        </h1>
      </div>
       {/* Loading message with subtle fade animation */}
       <p className="text-text-medium mt-8 animate-subtle-fade">Initializing Cybernetic Core...</p>
       {/* Creator credit with a simple fade-in effect. */}
       <p className="font-code text-sm text-text-medium mt-4 h-5 opacity-0 fade-in-up" style={{ animationDelay: '1500ms' }}>
           A Creation By <span className="text-primary font-bold text-glow-primary">SAKSHAM</span>
       </p>
    </div>
  );
};

export default LoadingScreen;
