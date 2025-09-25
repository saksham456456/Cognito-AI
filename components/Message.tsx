
import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Message } from '../types';
import { CognitoLogo } from './Logo';
import { ClipboardIcon, CheckIcon, Volume2Icon, RefreshIcon } from './icons';

interface MessageProps {
  message: Message;
  isLastMessage: boolean;
  onCopy: (text: string) => void;
  onSpeak: (message: Message) => void;
  onRegenerate: () => void;
  speakingMessageId: string | null;
}

const TypingIndicator = () => (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 bg-card-foreground/50 dark:bg-gray-500 rounded-full animate-typing-bounce [animation-delay:-0.3s]"></span>
      <span className="h-2 w-2 bg-card-foreground/50 dark:bg-gray-500 rounded-full animate-typing-bounce [animation-delay:-0.15s]"></span>
      <span className="h-2 w-2 bg-card-foreground/50 dark:bg-gray-500 rounded-full animate-typing-bounce"></span>
    </div>
);


const MessageComponent: React.FC<MessageProps> = ({ message, isLastMessage, onCopy, onSpeak, onRegenerate, speakingMessageId }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';
  const isTyping = message.role === 'model' && !message.content;
  const isSpeaking = speakingMessageId === message.id;

  useLayoutEffect(() => {
    if (!isExpanded && bubbleRef.current) {
        if (bubbleRef.current.scrollHeight > window.innerHeight * 0.5) {
            setIsExpanded(true);
        }
    }
  }, [message.content, isExpanded]);

  const containerClasses = `flex items-start gap-3 w-full group ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `px-4 py-3 rounded-2xl relative transition-[max-width] duration-300 ease-in-out ${
    isExpanded ? 'max-w-3xl' : 'max-w-xl'
  } ${
    isUser
      ? 'bg-primary dark:bg-yellow-500 text-primary-foreground dark:text-black rounded-br-none border border-black/10 dark:border-yellow-600'
      : 'bg-card dark:bg-[#1f1f1f] text-card-foreground dark:text-gray-200 rounded-bl-none border border-black/10 dark:border-[#333]'
  }`;

  const handleCopy = () => {
    onCopy(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const MessageActions = () => (
    <div className="absolute -bottom-2 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button onClick={handleCopy} className="p-1.5 rounded-full bg-input hover:bg-input-border dark:bg-[#292929] dark:hover:bg-[#404040] transition-colors border border-black/10 dark:border-[#404040]">
        {isCopied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4 text-card-foreground/60 dark:text-gray-400" />}
      </button>
      <button onClick={() => onSpeak(message)} className="p-1.5 rounded-full bg-input hover:bg-input-border dark:bg-[#292929] dark:hover:bg-[#404040] transition-colors border border-black/10 dark:border-[#404040]">
        <Volume2Icon className={`w-4 h-4 ${isSpeaking ? 'text-primary dark:text-yellow-400' : 'text-card-foreground/60 dark:text-gray-400'}`} />
      </button>
      {isLastMessage && (
        <button onClick={onRegenerate} className="p-1.5 rounded-full bg-input hover:bg-input-border dark:bg-[#292929] dark:hover:bg-[#404040] transition-colors border border-black/10 dark:border-[#404040]">
          <RefreshIcon className="w-4 h-4 text-card-foreground/60 dark:text-gray-400" />
        </button>
      )}
    </div>
  );

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-card dark:bg-[#1f1f1f] flex items-center justify-center border border-black/10 dark:border-[#333]">
          <CognitoLogo className="h-6 w-6" />
        </div>
      )}
      <div className="flex flex-col items-start gap-2">
        <div ref={bubbleRef} className={bubbleClasses}>
          {isTyping ? <TypingIndicator /> : <p className="whitespace-pre-wrap">{message.content}</p>}
        </div>
        {!isUser && !isTyping && message.content && <MessageActions />}
      </div>
    </div>
  );
};

export default MessageComponent;
