

import React from 'react';
import { XIcon } from './icons';
import { CognitoLogo } from './Logo';

// Modal ke props ka interface define kar rahe hain.
interface AboutModalProps {
  isOpen: boolean; // Modal dikhana hai ya nahi.
  onClose: () => void; // Modal band karne ka function.
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  // Agar modal open nahi hai, to kuch bhi render mat karo.
  if (!isOpen) return null;

  return (
    // Main container, poori screen ko cover karta hai ek semi-transparent background ke sath.
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Background pe click karne se modal band ho jayega.
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      {/* Modal ka content area */}
      <div 
        className="glassmorphism rounded-2xl w-full max-w-md p-6 relative fade-in-up"
        onClick={e => e.stopPropagation()} // Modal ke andar click karne se modal band nahi hoga.
      >
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-input"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5 text-text-medium" />
        </button>
        {/* Modal ka header section */}
        <div className="flex flex-col items-center text-center">
            <CognitoLogo className="w-20 h-20 text-primary mb-4" />
            <h2 id="about-modal-title" className="font-heading text-2xl font-bold text-text-light mb-2">About Cognito AI</h2>
            <p className="text-sm text-text-medium mb-6">Your Personal AI Assistant</p>
        </div>
        {/* Modal ka body content */}
        <div className="space-y-4 text-sm text-text-light text-left">
            <p>
                {/* External link, _blank se naye tab me khulega */}
                <a href="https://www.instagram.com/reel/DPT0FM6k0MS/?utm_source=ig_web_copy_link&igsh=MTU2ZTN5anUwdHdicQ==" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Cognito AI</a> is a modern, responsive AI assistant crafted to provide intelligent answers and a premium user experience.
            </p>
            <p>
                This application was developed by <a href="https://www.instagram.com/saksham_456456?utm_source=ig_web_button_share_sheet&igsh=MWplM21keGhpbmZnZw==" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Saksham</a>, a passionate frontend engineer with a knack for creating beautiful, functional user interfaces.
            </p>
            <p>
                It is fueled by <a href="https://github.com/saksham456456" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Saksham's knowledge</a>, curiosity in ML & DBMS, and his interests.
            </p>
        </div>
        {/* Modal ka footer section */}
        <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-yellow-400 transition-colors border border-primary-foreground/20"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;