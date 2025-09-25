
import React from 'react';
import { XIcon } from './icons';

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
        <h2 id="about-modal-title" className="text-2xl font-bold text-primary dark:text-yellow-400 mb-4">About the Developer</h2>
        <div className="text-card-foreground/80 dark:text-gray-300 space-y-4">
          <p>
            Hello! I'm Saksham, the developer behind Cognito AI. I'm passionate about creating beautiful, intuitive, and performant user interfaces that leverage the power of artificial intelligence.
          </p>
          <p>
            Cognito is a showcase of modern web development techniques, combining a sleek design with the advanced conversational capabilities of Google's Gemini model. My goal was to build an AI assistant that is not only smart but also a pleasure to use.
          </p>
          <p>
            Thank you for trying it out!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;