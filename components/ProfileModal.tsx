
import React, { useState, useEffect } from 'react';
import { XIcon, UserCircleIcon } from './icons';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentName: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentName }) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
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
        <div className="flex flex-col items-center">
            <UserCircleIcon className="w-20 h-20 text-primary dark:text-yellow-400 mb-4" />
            <h2 id="profile-modal-title" className="text-2xl font-bold text-card-foreground dark:text-gray-100 mb-2">Edit Profile</h2>
            <p className="text-sm text-card-foreground/60 dark:text-gray-400 mb-6">Update your display name.</p>
        </div>
        <div className="space-y-4">
            <div>
                <label htmlFor="userName" className="text-sm font-medium text-card-foreground/80 dark:text-gray-300">Display Name</label>
                <input
                    id="userName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    className="mt-1 w-full bg-input dark:bg-[#292929] border border-input-border dark:border-zinc-700 rounded-lg px-3 py-2 text-card-foreground dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-yellow-400 transition-colors"
                    placeholder="Enter your name"
                />
            </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-input hover:bg-input-border dark:bg-[#292929] dark:hover:bg-[#404040] transition-colors border border-card-border dark:border-zinc-700"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-primary dark:bg-yellow-400 text-primary-foreground dark:text-black hover:bg-yellow-400 dark:hover:bg-yellow-300 transition-colors border border-primary-foreground/20 dark:border-transparent"
            >
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;