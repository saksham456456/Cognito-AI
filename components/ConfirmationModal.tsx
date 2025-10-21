import React from 'react';
import { XIcon, TrashIcon } from './icons';

// Defining the interface for the Confirmation Modal's props.
interface ConfirmationModalProps {
  isOpen: boolean; // Whether to show the modal or not.
  onClose: () => void; // Function to close the modal.
  onConfirm: () => void; // Function to run when the "Confirm" button is clicked.
  title: string; // The modal's title.
  message: string; // The modal's message body.
  confirmButtonText?: string; // Text for the confirm button (optional, defaults to 'Confirm').
  t: (key: string) => string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmButtonText = 'Confirm',
  t
}) => {
  // If the modal is not open, don't render anything.
  if (!isOpen) return null;

  return (
    // Main container, covers the entire screen.
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Clicking on the background will close the modal.
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* The modal's content area */}
      <div 
        className="glassmorphism rounded-2xl w-full max-w-sm p-6 relative fade-in-up"
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
        {/* Modal's header section (Icon, Title, Message) */}
        <div className="flex flex-col items-center text-center">
            {/* Action-specific icon (here, TrashIcon for delete) */}
            <div className="p-3 bg-red-500/10 rounded-full mb-4 border border-red-500/30">
                <TrashIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 id="confirm-modal-title" className="font-heading text-xl font-bold text-text-light mb-2">{title}</h2>
            <p className="text-sm text-text-medium mb-6">{message}</p>
        </div>
        {/* Modal's action buttons (Cancel and Confirm) */}
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-input hover:bg-input-border transition-all duration-200 border border-card-border hover:scale-105 active:scale-100"
            >
                {t('modals.cancel')}
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 hover:scale-105 active:scale-100"
            >
                {confirmButtonText}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;