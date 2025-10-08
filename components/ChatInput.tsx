
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, EmojiHappyIcon } from './icons';

// ChatInput component ke props ka interface define kar rahe hain.
interface ChatInputProps {
  onSendMessage: (message: string) => void; // Message bhejne ke liye function.
  isLoading: boolean; // AI response generate kar raha hai ya nahi.
  showSuggestions: boolean; // Shuruaati suggestions dikhane hain ya nahi.
}

// Suggestion button ke liye ek chhota sa component.
const SuggestionButton: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 glassmorphism border border-card-border rounded-lg text-text-medium hover:text-primary hover:border-primary transition-all duration-300 neon-glow-button text-sm"
    >
        {text}
    </button>
)

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, showSuggestions }) => {
  // State variables
  const [inputValue, setInputValue] = useState(''); // Textarea ka current value.
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false); // Emoji picker khula hai ya nahi.

  // DOM elements ke liye Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Textarea ko access karne ke liye.
  const emojiPickerRef = useRef<HTMLDivElement>(null); // Emoji picker ke bahar click detect karne ke liye.
  const emojiButtonRef = useRef<HTMLButtonElement>(null); // Emoji button ke bahar click detect karne ke liye.
  
  // Shuruaati chat suggestions ka array.
  const suggestions = [
      "Give me ideas for a sci-fi story",
      "Explain quantum computing simply",
      "Write a futuristic poem"
  ]

  // Suggestion pe click hone par, us suggestion ko message olarak bhej dete hain.
  const handleSuggestionClick = (suggestion: string) => {
      setInputValue(suggestion);
      onSendMessage(suggestion); // Main component ko message bhejte hain.
  }

  // Jab bhi inputValue change hota hai, textarea ki height ko dynamically adjust karte hain.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Pehle height reset karo.
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`; // Nayi height set karo.
    }
  }, [inputValue]);
  
  // Yeh effect emoji picker ke bahar click ko handle karta hai, use band karne ke liye.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            isEmojiPickerOpen &&
            emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node) &&
            emojiButtonRef.current && !emojiButtonRef.current.contains(event.target as Node)
        ) {
            setIsEmojiPickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup function: component unmount hone par event listener ko remove kar deta hai.
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  // Emoji select hone par use input value me add kar deta hai.
  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    textareaRef.current?.focus(); // Focus wapas textarea pe le aate hain.
  };

  // Form submit hone par message bhejta hai.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Default form submission ko rokte hain.
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue(''); // Input field ko khali kar dete hain.
    }
  };

  // Enter key dabane par message bhejta hai (Shift+Enter se new line aayega).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 flex-shrink-0">
        {/* Agar showSuggestions true hai to suggestions dikhao */}
        {showSuggestions && (
            <div className="flex justify-center items-center gap-3 mb-4 animate-fade-in-up">
                {suggestions.map((text) => (
                    <SuggestionButton key={text} text={text} onClick={() => handleSuggestionClick(text)} />
                ))}
            </div>
        )}
        <div className="relative">
             {/* Agar emoji picker open hai to use render karo */}
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
            {/* Main form jisme textarea aur send button hai */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2 bg-input rounded-xl border border-input-border focus-within:border-primary transition-colors duration-300">
                {/* Emoji picker toggle button */}
                <button
                    type="button"
                    ref={emojiButtonRef}
                    onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                    className="flex-shrink-0 w-10 h-10 rounded-lg text-text-medium hover:text-primary flex items-center justify-center transition-colors disabled:opacity-50"
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
                    placeholder="Message Cognito..."
                    rows={1}
                    className="flex-grow bg-transparent text-text-light placeholder-text-dark resize-none focus:outline-none p-2 max-h-48 custom-scrollbar"
                    disabled={isLoading}
                />
                {/* Send/Submit button */}
                <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 hover:scale-110 active:scale-100"
                >
                    {/* Loading state me spinner dikhao, nahi to send icon */}
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SendIcon className="w-6 h-6" />
                    )}
                </button>
            </form>
        </div>
    </div>
  );
};

export default ChatInput;