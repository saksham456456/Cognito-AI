import React, { useState, useEffect } from 'react';
import { XIcon, UserCircleIcon } from './icons';

// Defining the interface for the Profile Modal's props.
interface ProfileModalProps {
  isOpen: boolean; // Whether to show the modal or not.
  onClose: () => void; // Function to close the modal.
  onSave: (newName: string) => void; // Function to save the name.
  currentName: string; // The current user's name.
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentName }) => {
  // State for the input field.
  const [name, setName] = useState(currentName);

  // Whenever the modal opens, set the input field to the current name.
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [currentName, isOpen]);

  // If the modal is not open, don't render anything.
  if (!isOpen) return null;

  // Handler for the save button.
  const handleSave = () => {
    // Save if the name is not empty.
    if (name.trim()) {
      onSave(name.trim());
      onClose(); // Close the modal.
    }
  };

  return (
    // Main container, covers the entire screen.
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Clicking on the background will close the modal.
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
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
        {/* Modal header */}
        <div className="flex flex-col items-center">
            <UserCircleIcon className="w-20 h-20 text-primary mb-4" />
            <h2 id="profile-modal-title" className="font-heading text-2xl font-bold text-text-light mb-2">Operator Profile</h2>
            <p className="text-sm text-text-medium mb-6">Update your callsign.</p>
        </div>
        {/* Modal form area */}
        <div className="space-y-4">
            <div>
                <label htmlFor="userName" className="text-sm font-medium text-text-light">Callsign</label>
                <input
                    id="userName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()} // Also save on Enter key press.
                    className="mt-1 w-full bg-input border border-input-border rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your callsign"
                />
            </div>
        </div>
        {/* Modal action buttons */}
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-input hover:bg-input-border transition-colors border border-card-border"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-yellow-400 transition-colors border border-primary-foreground/20"
            >
                Save Changes
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
