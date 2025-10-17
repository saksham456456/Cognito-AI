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

  const renderLineWithLink = (lineKey: string, linkKey: string, href: string) => {
    const line = t(`modals.${lineKey}`);
    const linkText = t(`modals.${linkKey}`);
    if (!line || !line.includes('{{link}}')) {
        return <p>{line}</p>;
    }
    const parts = line.split('{{link}}');
    return (
        <p>
            {parts[0]}
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
                {linkText}
            </a>
            {parts[1]}
        </p>
    );
  };


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
            {renderLineWithLink('aboutLine1', 'aboutLine1Link', 'https://www.instagram.com/reel/DPT0FM6k0MS/?utm_source=ig_web_copy_link&igsh=MTU2ZTN5anUwdHdicQ==')}
            {renderLineWithLink('aboutLine2', 'aboutLine2Link', 'https://www.instagram.com/saksham_456456?utm_source=ig_web_button_share_sheet&igsh=MWplM21keGhpbmZnZw==')}
            {renderLineWithLink('aboutLine3', 'aboutLine3Link', 'https://github.com/saksham456456')}
        </div>
      </div>
    </div>
  );
};

export default AboutModal;