import React, { useState } from 'react';
import type { Message } from '../types';
import { CognitoLogo } from './Logo';
import { ClipboardIcon, CheckIcon, Volume2Icon, RefreshIcon, StopIcon } from './icons';
import MarkdownRenderer from './MarkdownRenderer';

// Message component ke props ka interface define kar rahe hain.
interface MessageProps {
  message: Message; // Message object (id, role, content).
  isLastMessage: boolean; // Kya yeh chat ka aakhri message hai?
  isAiLoading: boolean; // AI response generate kar raha hai ya nahi?
  onCopy: (text: string) => void; // Copy button ka function.
  onSpeak: (message: Message) => void; // Text-to-speech button ka function.
  onRegenerate: () => void; // Regenerate button ka function.
  onStopGeneration: () => void; // "Stop Generating" button ka function
  speakingMessageId: string | null; // Currently bolne wale message ka ID.
}

// AI "typing..." indicator ke liye chhota sa component.
const PulsingOrbIndicator = () => (
    <div className="flex items-center justify-center p-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-orb-pulse"></div>
    </div>
);

// Main message component.
const MessageComponent: React.FC<MessageProps> = ({ 
    message, 
    isLastMessage,
    isAiLoading,
    onCopy, 
    onSpeak, 
    onRegenerate, 
    onStopGeneration,
    speakingMessageId 
}) => {
  const [isCopied, setIsCopied] = useState(false); // Text copy hua ya nahi, iska state.
  const isUser = message.role === 'user'; // Check kar rahe hain ki message user ka hai ya model ka.
  const isTyping = message.role === 'model' && !message.content && isAiLoading; // Check kar rahe hain ki AI abhi type kar raha hai ya nahi.
  const isSpeaking = speakingMessageId === message.id; // Check kar rahe hain ki yeh message bola ja raha hai ya nahi.

  // Conditional styling ke liye classes.
  const containerClasses = `flex items-start gap-3 w-full group ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `px-4 py-3 rounded-2xl relative transition-shadow duration-300 max-w-3xl ${
    isUser
      ? 'bg-accent1/10 text-text-light rounded-br-none border border-accent1/50'
      : 'bg-primary/10 text-text-light rounded-bl-none border border-primary/50 glow-border'
  }`;

  // Copy button ka handler.
  const handleCopy = () => {
    onCopy(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // 2 second ke baad 'copied' state ko reset kar dete hain.
  };
  
  // Wrapper copy function to handle both full message and code blocks
  const copyHandler = (textToCopy: string) => {
      onCopy(textToCopy);
      // We don't manage a global copied state here, it's handled in the code block itself
  }

  // Message ke neeche dikhne wale action buttons (Copy, Speak, Regenerate).
  const MessageActions = () => (
    <div className="absolute -bottom-8 left-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Copy button */}
      <button onClick={handleCopy} title="Copy" className="p-1.5 rounded-full bg-input hover:bg-input-border transition-colors border border-card-border">
        {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4 text-text-medium" />}
      </button>
      {/* Speak button */}
      <button onClick={() => onSpeak(message)} title="Speak" className="p-1.5 rounded-full bg-input hover:bg-input-border transition-colors border border-card-border">
        <Volume2Icon className={`w-4 h-4 ${isSpeaking ? 'text-primary' : 'text-text-medium'}`} />
      </button>
      {/* Regenerate button (sirf aakhri model message ke liye dikhega) */}
      {isLastMessage && !isAiLoading && (
        <button onClick={onRegenerate} title="Regenerate" className="p-1.5 rounded-full bg-input hover:bg-input-border transition-colors border border-card-border">
          <RefreshIcon className="w-4 h-4 text-text-medium" />
        </button>
      )}
    </div>
  );
  
  // Stop Generation button
  const StopButton = () => (
      <button 
          onClick={onStopGeneration} 
          className="flex items-center gap-2 px-3 py-1.5 mt-3 rounded-lg text-sm transition-colors border border-input-border hover:border-primary text-text-medium hover:text-primary font-semibold neon-glow-button"
          title="Stop generating response"
      >
          <StopIcon className="w-4 h-4" />
          Stop Generating
      </button>
  )

  return (
    <div className={containerClasses}>
      {/* Model ke message ke sath logo dikhate hain. */}
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-input flex items-center justify-center border border-input-border">
          <CognitoLogo className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-col items-start gap-2 relative">
        {/* Message bubble */}
        <div className={bubbleClasses}>
          {isTyping ? (
              <PulsingOrbIndicator />
          ) : (
            <MarkdownRenderer
                content={message.content}
                onCopyCode={copyHandler}
             />
          )}
        </div>
        {/* Actions dikhate hain */}
        {!isUser && !isTyping && message.content && <MessageActions />}
        {isLastMessage && isAiLoading && <StopButton />}
      </div>
    </div>
  );
};

export default MessageComponent;
