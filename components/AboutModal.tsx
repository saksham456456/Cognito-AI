
import React from 'react';
import { XIcon } from './icons';
import { CognitoLogo } from './Logo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div 
        className="bg-card dark:bg-[#1f1f1f] rounded-2xl w-full max-w-md p-6 border border-card-border dark:border-zinc-800 relative fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-input dark:hover:bg-[#292929]"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5 text-card-foreground/70 dark:text-gray-400" />
        </button>
        <div className="flex flex-col items-center text-center">
            <CognitoLogo className="w-20 h-20 text-primary dark:text-yellow-400 mb-4" />
            <h2 id="about-modal-title" className="text-2xl font-bold text-card-foreground dark:text-gray-100 mb-2">About Cognito AI</h2>
            <p className="text-sm text-card-foreground/60 dark:text-gray-400 mb-6">Your Personal AI Assistant</p>
        </div>
        <div className="space-y-4 text-sm text-card-foreground/80 dark:text-gray-300 text-left">
            <p>
                Cognito AI is a modern, responsive AI assistant designed to provide intelligent answers and a seamless user experience. 
            </p>
            <p>
                This application was developed by <strong className="text-primary dark:text-yellow-400">Saksham</strong>, a passionate frontend engineer with expertise in creating beautiful and functional user interfaces.
            </p>
            <p>
                Powered by Google's Gemini API, Cognito AI showcases the latest in AI-driven conversation and interaction.
            </p>
        </div>
        <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary dark:bg-yellow-400 text-primary-foreground dark:text-black hover:bg-yellow-400 dark:hover:bg-yellow-300 transition-colors border border-primary-foreground/20 dark:border-transparent"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
