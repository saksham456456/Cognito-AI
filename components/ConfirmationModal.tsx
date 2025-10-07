

import React from 'react';
import { XIcon, TrashIcon } from './icons';

// Confirmation Modal ke props ka interface define kar rahe hain.
interface ConfirmationModalProps {
  isOpen: boolean; // Modal dikhana hai ya nahi.
  onClose: () => void; // Modal band karne ka function.
  onConfirm: () => void; // "Confirm" button pe click hone par chalne wala function.
  title: string; // Modal ka title.
  message: string; // Modal ka message body.
  confirmButtonText?: string; // Confirm button ka text (optional, default 'Confirm').
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmButtonText = 'Confirm' 
}) => {
  // Agar modal open nahi hai, to kuch bhi render mat karo.
  if (!isOpen) return null;

  return (
    // Main container, poori screen ko cover karta hai.
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Background pe click karne se modal band hoga.
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Modal ka content area */}
      <div 
        className="glassmorphism rounded-2xl w-full max-w-sm p-6 relative fade-in-up"
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
        {/* Modal ka header section (Icon, Title, Message) */}
        <div className="flex flex-col items-center text-center">
            {/* Action-specific icon (yahan pe delete ke liye TrashIcon) */}
            <div className="p-3 bg-red-500/10 rounded-full mb-4 border border-red-500/30">
                <TrashIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 id="confirm-modal-title" className="font-heading text-xl font-bold text-text-light mb-2">{title}</h2>
            <p className="text-sm text-text-medium mb-6">{message}</p>
        </div>
        {/* Modal ke action buttons (Cancel aur Confirm) */}
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-input hover:bg-input-border transition-colors border border-card-border"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
                {confirmButtonText}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;