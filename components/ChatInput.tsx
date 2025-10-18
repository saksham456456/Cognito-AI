import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { SendIcon, EmojiHappyIcon, CodeBracketIcon } from './icons';
import { CognitoLogo } from './Logo';
import type { AiMode } from '../types';

// Defining the interface for the ChatInput component's props.
interface ChatInputProps {
  onSendMessage: (message: string) => void; // Function to send a message.
  isLoading: boolean; // Is the AI currently generating a response?
  showSuggestions: boolean; // Should initial suggestions be shown?
  suggestions: string[]; // The array of suggestion strings to display.
  aiMode: AiMode;
  onAiModeChange: (mode: AiMode) => void;
  onRectChange: (rect: DOMRect | null) => void; // Reports the input's position.
  t: (key: string, fallback?: any) => any;
}

// A small component for the suggestion button.
const SuggestionButton: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 glassmorphism border border-card-border rounded-lg text-text-medium hover:text-primary hover:border-primary transition-all duration-300 neon-glow-button text-sm"
    >
        {text}
    </button>
)

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, showSuggestions, suggestions, aiMode, onAiModeChange, onRectChange, t }) => {
  // State variables
  const [inputValue, setInputValue] = useState(''); // The current value of the textarea.
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false); // Is the emoji picker open?
  const [isModePickerOpen, setIsModePickerOpen] = useState(false); // Is the mode picker open?
  const [isFocused, setIsFocused] = useState(false); // Input focus state for the glow effect.
  const [isSending, setIsSending] = useState(false); // Triggers the send animation.

  // Refs for DOM elements
  const textareaRef = useRef<HTMLTextAreaElement>(null); // To access the textarea.
  const emojiPickerRef = useRef<HTMLDivElement>(null); // To detect clicks outside the emoji picker.
  const emojiButtonRef = useRef<HTMLButtonElement>(null); // To detect clicks on the emoji button.
  const modePickerRef = useRef<HTMLDivElement>(null);
  const modeButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null); // Ref for the main form element for position tracking.
  
  // This effect reports the form's position to the parent for animations.
  useLayoutEffect(() => {
    if (formRef.current) {
        onRectChange(formRef.current.getBoundingClientRect());
    }
    const handleResize = () => {
        if (formRef.current) {
            onRectChange(formRef.current.getBoundingClientRect());
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        onRectChange(null);
    };
  }, [onRectChange]);

  // When a suggestion is clicked, send it as a message.
  const handleSuggestionClick = (suggestion: string) => {
      onSendMessage(suggestion); // Sends the message to the main component.
      setInputValue('');
  }

  // Whenever inputValue changes, dynamically adjust the textarea's height.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // First, reset the height.
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`; // Set the new height.
    }
  }, [inputValue]);
  
  // This effect handles clicks outside the emoji/mode picker to close it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (isEmojiPickerOpen && emojiPickerRef.current && !emojiPickerRef.current.contains(target) && emojiButtonRef.current && !emojiButtonRef.current.contains(target)) {
            setIsEmojiPickerOpen(false);
        }
        if (isModePickerOpen && modePickerRef.current && !modePickerRef.current.contains(target) && modeButtonRef.current && !modeButtonRef.current.contains(target)) {
            setIsModePickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup function: removes the event listener when the component unmounts.
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen, isModePickerOpen]);

  // Adds the selected emoji to the input value.
  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    textareaRef.current?.focus(); // Brings focus back to the textarea.
  };

  // Sends the message when the form is submitted.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents default form submission.
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue(''); // Clears the input field.
      // Trigger the send animation.
      setIsSending(true);
      setTimeout(() => setIsSending(false), 500); // Duration of the pulse animation.
    }
  };

  // Sends the message when the Enter key is pressed (Shift+Enter creates a new line).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleModeChange = (mode: AiMode) => {
      onAiModeChange(mode);
      setIsModePickerOpen(false);
  }

  const ModePicker = () => (
      <div ref={modePickerRef} className="absolute bottom-full mb-2 w-64 glassmorphism rounded-xl p-2 shadow-lg z-10 fade-in-up" style={{ animationDuration: '200ms'}}>
          <p className="text-xs text-text-dark px-2 pb-1 font-semibold">{t('chatInput.selectMode')}</p>
          <div className="space-y-1">
            <button onClick={() => handleModeChange('cognito')} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${aiMode === 'cognito' ? 'bg-primary/20' : 'hover:bg-input'}`}>
                <CognitoLogo className="w-8 h-8 flex-shrink-0" />
                <div>
                    <p className={`font-semibold ${aiMode === 'cognito' ? 'text-primary' : 'text-text-light'}`}>{t('chatInput.modeCognito')}</p>
                    <p className="text-xs text-text-medium">{t('chatInput.modeCognitoDesc')}</p>
                </div>
            </button>
            <button onClick={() => handleModeChange('code-assistant')} className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${aiMode === 'code-assistant' ? 'bg-primary/20' : 'hover:bg-input'}`}>
                 <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <CodeBracketIcon className="w-7 h-7" />
                 </div>
                <div>
                    <p className={`font-semibold ${aiMode === 'code-assistant' ? 'text-primary' : 'text-text-light'}`}>{t('chatInput.modeCode')}</p>
                    <p className="text-xs text-text-medium">{t('chatInput.modeCodeDesc')}</p>
                </div>
            </button>
          </div>
      </div>
  )

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 flex-shrink-0">
        {/* If showSuggestions is true, show the suggestions */}
        {showSuggestions && (
            <div className="flex justify-center items-center gap-3 mb-4 animate-fade-in-up">
                {Array.isArray(suggestions) && suggestions.map((text) => (
                    <SuggestionButton key={text} text={text} onClick={() => handleSuggestionClick(text)} />
                ))}
            </div>
        )}
        <div className="relative">
             {isModePickerOpen && <ModePicker />}
             {isEmojiPickerOpen && (
                <div ref={emojiPickerRef} className="absolute bottom-full mb-2 w-80 glassmorphism rounded-xl p-3 shadow-lg z-10 fade-in-up" style={{ animationDuration: '200ms'}}>
                    <div className="grid grid-cols-8 gap-1">
                        {['😀', '😂', '😍', '🤔', '👍', '🙏', '🚀', '🎉', '💡', '🔥', '❤️', '💯', '😊', '😭', '🤯', '👋'].map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleEmojiSelect(emoji)}
                                className="p-1 rounded-lg text-2xl hover:bg-input transition-colors"
                                aria-label={`Emoji ${emoji}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {/* Main form containing the textarea and send button */}
            <form ref={formRef} onSubmit={handleSubmit} className={`relative flex items-end gap-2 p-2 bg-input rounded-xl border transition-all duration-300 ${isFocused ? 'glow-border-active border-primary' : 'border-input-border'} ${isSending ? 'input-is-sending' : ''}`}>
                {/* Buttons and textarea now sit above the SVG layer */}
                <button
                    type="button"
                    ref={modeButtonRef}
                    onClick={() => setIsModePickerOpen(prev => !prev)}
                    className="flex-shrink-0 h-10 px-2 rounded-lg text-text-medium hover:bg-card-border flex items-center justify-center transition-colors disabled:opacity-50 z-10"
                    aria-label="Change AI mode"
                    disabled={isLoading}
                >
                    {aiMode === 'cognito' ? <CognitoLogo className="w-6 h-6" /> : <CodeBracketIcon className="w-6 h-6" />}
                </button>
                <button
                    type="button"
                    ref={emojiButtonRef}
                    onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                    className="flex-shrink-0 w-10 h-10 rounded-lg text-text-medium hover:text-primary flex items-center justify-center transition-colors disabled:opacity-50 z-10"
                    aria-label="Add emoji"
                    disabled={isLoading}
                >
                    <EmojiHappyIcon className="w-6 h-6" />
                </button>
                {/* Text input area */}
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={aiMode === 'cognito' ? t('chatInput.placeholderCognito') : t('chatInput.placeholderCode')}
                    rows={1}
                    className="flex-grow bg-transparent text-text-light placeholder-text-dark resize-none focus:outline-none p-2 max-h-48 custom-scrollbar z-10"
                    disabled={isLoading}
                />
                {/* Send/Submit button */}
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 hover:scale-110 active:scale-100 z-10"
                >
                    {/* Show a spinner in the loading state, otherwise show the send icon */}
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SendIcon className="w-6 h-6" />
                    )}
                </button>
            </form>
             {/* Helper text */}
             <p className="text-xs text-text-dark text-center mt-2 px-4 transition-opacity duration-300 opacity-50 focus-within:opacity-100">
                <kbd className="px-1.5 py-0.5 border border-input-border rounded-sm">Shift</kbd> + <kbd className="px-1.5 py-0.5 border border-input-border rounded-sm">Enter</kbd> for a new line.
            </p>
        </div>
    </div>
  );
};

export default ChatInput;