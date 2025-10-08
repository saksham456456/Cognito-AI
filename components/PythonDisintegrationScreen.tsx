import React from 'react';

// Main Disintegration Screen component.
const PythonDisintegrationScreen: React.FC = () => {
    return (
        // Full screen container with CRT effect.
        <div className="flex flex-col items-center justify-center h-full w-full bg-background crt-effect relative overflow-hidden">
            {/* 1. Static noise overlay */}
            <div 
                className="absolute inset-0 z-20 opacity-0 animate-static-flicker"
                style={{ 
                    backgroundImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXVuZmaEhIQSEhAdHR2tra1La2tGZmZsbGxEWlpWVVVjwMHLz8+Dg4OHh4fT09PS0tJwcHCJe3t7e3uAb3BxeXpxeXlxcXGTk5N6e3t7e3uAAAAAXIm6AAAAHUlEQVRIx+3MyQ0AIBAD0e77v1Y2hYh2I2P69gAAAABJRU5ErkJggg==)',
                    animationDelay: '1.8s',
                    animationDuration: '2.2s'
                }}
            />
            
            {/* 2. Scanline wipe overlay */}
            <div 
                className="absolute inset-0 z-10 bg-background animate-scanline-wipe" 
                style={{
                    animationDelay: '1s',
                    backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 50%)',
                    backgroundSize: '100% 4px'
                }}
            />
            
            {/* 3. Main content that glitches and fades */}
            <div 
                className="flex flex-col items-center gap-4 z-0 animate-intense-glitch opacity-100"
                style={{
                    animationDuration: '0.8s',
                    animationFillMode: 'forwards',
                    animationDelay: '0.2s',
                }}
            >
                <div 
                    className="opacity-100"
                    style={{
                        animation: 'fade-out 1.5s forwards',
                        animationDelay: '1.2s'
                    }}
                >
                    <h1 className="font-heading text-2xl font-bold text-red-500 uppercase tracking-wider" style={{ textShadow: '0 0 8px #f00' }}>
                        CONNECTION SEVERED
                    </h1>
                    <p className="text-center font-code text-text-medium mt-1">Disengaging Python Core...</p>
                </div>
            </div>
        </div>
    );
};

export default PythonDisintegrationScreen;