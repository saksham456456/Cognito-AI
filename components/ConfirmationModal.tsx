
import React from 'react';
import { XIcon, TrashIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmButtonText = 'Confirm' 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div 
        className="bg-card dark:bg-[#1f1f1f] rounded-2xl w-full max-w-sm p-6 border border-card-border dark:border-zinc-800 relative fade-in-up"
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
            <div className="p-3 bg-red-500/10 rounded-full mb-4">
                <TrashIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 id="confirm-modal-title" className="text-xl font-bold text-card-foreground dark:text-gray-100 mb-2">{title}</h2>
            <p className="text-sm text-card-foreground/60 dark:text-gray-400 mb-6">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-input hover:bg-input-border dark:bg-[#292929] dark:hover:bg-[#404040] transition-colors border border-card-border dark:border-zinc-700"
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
