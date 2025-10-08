import React, { useState } from 'react';
import type { Message } from '../types';
import { CognitoLogo } from './Logo';
import { ClipboardIcon, CheckIcon, Volume2Icon, RefreshIcon, StopIcon } from './icons';
import MarkdownRenderer from './MarkdownRenderer';

// Defining the interface for the Message component's props.
interface MessageProps {
  message: Message; // The message object (id, role, content).
  isLastMessage: boolean; // Is this the last message in the chat?
  isAiLoading: boolean; // Is the AI currently generating a response?
  onCopy: (text: string) => void; // Function for the copy button.
  onSpeak: (message: Message) => void; // Function for the text-to-speech button.
  onRegenerate: () => void; // Function for the regenerate button.
  onStopGeneration: () => void; // Function for the "Stop Generating" button.
  speakingMessageId: string | null; // The ID of the message currently being spoken.
}

// A small component for the AI "typing..." indicator.
const PulsingOrbIndicator = () => (
    <div className="flex items-center justify-center p-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-orb-pulse"></div>
    </div>
);

// The main message component.
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
  const [isCopied, setIsCopied] = useState(false); // State for whether the text has been copied.
  const isUser = message.role === 'user'; // Checking if the message is from the user or the model.
  const isTyping = message.role === 'model' && !message.content && isAiLoading; // Checking if the AI is currently typing.
  const isSpeaking = speakingMessageId === message.id; // Checking if this message is being spoken.

  // Classes for conditional styling.
  const containerClasses = `flex items-start gap-3 w-full group ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `px-4 py-3 rounded-2xl relative transition-shadow duration-300 max-w-3xl ${
    isUser
      ? 'bg-accent1/10 text-text-light rounded-br-none border border-accent1/50'
      : 'bg-primary/10 text-text-light rounded-bl-none border border-primary/50 glow-border'
  }`;

  // Handler for the copy button.
  const handleCopy = () => {
    onCopy(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset the 'copied' state after 2 seconds.
  };
  
  // Wrapper copy function to handle both full message and code blocks.
  const copyHandler = (textToCopy: string) => {
      onCopy(textToCopy);
      // We don't manage a global copied state here; it's handled in the code block itself.
  }

  // Action buttons (Copy, Speak, Regenerate) that appear below the message.
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
      {/* Regenerate button (only shown for the last model message) */}
      {isLastMessage && !isAiLoading && (
        <button onClick={onRegenerate} title="Regenerate" className="p-1.5 rounded-full bg-input hover:bg-input-border transition-colors border border-card-border">
          <RefreshIcon className="w-4 h-4 text-text-medium" />
        </button>
      )}
    </div>
  );
  
  // Stop Generation button.
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
      {/* Show the logo with the model's message. */}
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
        {/* Show actions */}
        {!isUser && !isTyping && message.content && <MessageActions />}
        {isLastMessage && isAiLoading && <StopButton />}
      </div>
    </div>
  );
};

export default MessageComponent;
