
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  showSuggestions: boolean;
}

// FIX: Use React.FC to correctly type the component and allow for the 'key' prop used in the .map() function.
const SuggestionButton: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 bg-card dark:bg-[#1f1f1f] border border-card-border dark:border-zinc-800 rounded-lg text-card-foreground/80 dark:text-gray-300 hover:bg-primary/20 hover:border-primary/50 dark:hover:bg-yellow-400/10 dark:hover:border-yellow-400/50 transition-colors duration-200"
    >
        {text}
    </button>
)

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, showSuggestions }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const suggestions = [
      "Give me ideas",
      "Help me write",
      "Tell me a fun fact"
  ]

  const handleSuggestionClick = (suggestion: string) => {
      setInputValue(suggestion);
      onSendMessage(suggestion);
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
        {showSuggestions && (
            <div className="flex justify-center items-center gap-4 mb-4">
                {suggestions.map((text) => (
                    <SuggestionButton key={text} text={text} onClick={() => handleSuggestionClick(text)} />
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 bg-input dark:bg-[#292929] rounded-xl border border-input-border dark:border-zinc-700 focus-within:border-primary dark:focus-within:border-yellow-400 transition-colors">
        <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-grow bg-transparent text-card-foreground dark:text-gray-200 placeholder-card-foreground/50 dark:placeholder-gray-500 resize-none focus:outline-none p-2 max-h-48 scrollbar-thin"
            disabled={isLoading}
        />
        <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary dark:bg-yellow-400 text-primary-foreground dark:text-black flex items-center justify-center transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 dark:hover:bg-yellow-300 border border-primary-foreground/20 dark:border-transparent"
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground dark:border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <SendIcon className="w-6 h-6" />
            )}
        </button>
        </form>
    </div>
  );
};

export default ChatInput;