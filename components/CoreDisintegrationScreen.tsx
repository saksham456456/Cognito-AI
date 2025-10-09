import React from 'react';

interface CoreDisintegrationScreenProps {
    children: React.ReactNode;
    show: boolean;
}

const CoreDisintegrationScreen: React.FC<CoreDisintegrationScreenProps> = ({ children, show }) => {
    // If the animation is not supposed to show, just render the content.
    if (!show) {
        return <>{children}</>;
    }

    return (
        // The main container applies the orchestrating animations to its child.
        // It also serves as a positioning context for the overlay.
        <div className="h-full w-full animate-core-disintegration">
            {/* The content to be animated (e.g., CodingPlayground) */}
            {children}
            {/* A separate overlay for the scanline wipe effect, which plays on top. */}
            <div className="scanline-wipe-overlay" />
        </div>
    );
};

export default CoreDisintegrationScreen;
