

import React, { useState, useEffect } from 'react';
import { XIcon, UserCircleIcon } from './icons';

// Profile Modal ke props ka interface define kar rahe hain.
interface ProfileModalProps {
  isOpen: boolean; // Modal dikhana hai ya nahi.
  onClose: () => void; // Modal band karne ka function.
  onSave: (newName: string) => void; // Naam save karne ka function.
  currentName: string; // Current user ka naam.
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentName }) => {
  // Input field ke liye state.
  const [name, setName] = useState(currentName);

  // Jab bhi modal khulta hai, input field ko current naam se set karte hain.
  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [currentName, isOpen]);

  // Agar modal open nahi hai, to kuch bhi render mat karo.
  if (!isOpen) return null;

  // Save button ka handler.
  const handleSave = () => {
    // Agar naam khali nahi hai to save karte hain.
    if (name.trim()) {
      onSave(name.trim());
      onClose(); // Modal band kar dete hain.
    }
  };

  return (
    // Main container, poori screen ko cover karta hai.
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose} // Background pe click karne se modal band hoga.
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
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
        {/* Modal ka header */}
        <div className="flex flex-col items-center">
            <UserCircleIcon className="w-20 h-20 text-primary mb-4" />
            <h2 id="profile-modal-title" className="font-heading text-2xl font-bold text-text-light mb-2">Operator Profile</h2>
            <p className="text-sm text-text-medium mb-6">Apna callsign update karein.</p>
        </div>
        {/* Modal ka form area */}
        <div className="space-y-4">
            <div>
                <label htmlFor="userName" className="text-sm font-medium text-text-light">Callsign</label>
                <input
                    id="userName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()} // Enter dabane par bhi save hoga.
                    className="mt-1 w-full bg-input border border-input-border rounded-lg px-3 py-2 text-text-light focus:outline-none focus:border-primary transition-colors"
                    placeholder="Apna callsign daalein"
                />
            </div>
        </div>
        {/* Modal ke action buttons */}
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