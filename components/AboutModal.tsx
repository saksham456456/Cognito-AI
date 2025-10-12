import React from 'react';
import { XIcon } from './icons';
import { CognitoLogo } from './Logo';

// Defining the interface for the Modal's props.
interface AboutModalProps {
  isOpen: boolean; // Whether to show the modal or not.
  onClose: () => void; // Function to close the modal.
  t: (key: string) => string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, t }) => {
  // If the modal is not open, don't render anything.
  if (!isOpen) return null;

  return (
    // Main container, covers the entire screen with a semi-transparent background.
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Clicking on the background will close the modal.
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      {/* The modal's content area */}
      <div 
        className="glassmorphism rounded-2xl w-full max-w-md p-6 relative fade-in-up"
        onClick={e => e.stopPropagation()} // Clicking inside the modal won't close it.
      >
        {/* Close button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-input"
          aria-label="Close"
        >
          <XIcon className="w-5 h-5 text-text-medium" />
        </button>
        {/* Modal's header section */}
        <div className="flex flex-col items-center text-center">
            <CognitoLogo className="w-20 h-20 text-primary mb-4" />
            <h2 id="about-modal-title" className="font-heading text-2xl font-bold text-text-light mb-2">{t('modals.aboutTitle')}</h2>
            <p className="text-sm text-text-medium mb-6">{t('modals.aboutSubtitle')}</p>
        </div>
        {/* Modal's body content */}
        <div className="space-y-4 text-sm text-text-light text-left">
            <p>
                {/* External link, opens in a new tab with _blank */}
                <a href="https://www.instagram.com/reel/DPT0FM6k0MS/?utm_source=ig_web_copy_link&igsh=MTU2ZTN5anUwdHdicQ==" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Cognito AI</a> {t('modals.aboutLine1').split('Cognito AI')[1]}
            </p>
            <p>
                {t('modals.aboutLine2').split('Saksham')[0]}<a href="https://www.instagram.com/saksham_456456?utm_source=ig_web_button_share_sheet&igsh=MWplM21keGhpbmZnZw==" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Saksham</a>{t('modals.aboutLine2').split('Saksham')[1]}
            </p>
            <p>
                {t('modals.aboutLine3').split('Saksham\'s knowledge')[0]}<a href="https://github.com/saksham456456" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{t('modals.aboutLine3').includes("Saksham's knowledge") ? "Saksham's knowledge" : "el conocimiento de Saksham"}</a>{t('modals.aboutLine3').split('Saksham\'s knowledge')[1] || t('modals.aboutLine3').split('el conocimiento de Saksham')[1]}
            </p>
        </div>
        {/* Modal's footer section */}
        <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-yellow-400 transition-colors border border-primary-foreground/20"
            >
                {t('modals.close')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
