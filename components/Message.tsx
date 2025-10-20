import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Message } from '../types';
import { CognitoLogo } from './Logo';
import { ClipboardIcon, CheckIcon, Volume2Icon, RefreshIcon, StopIcon, UserCircleIcon, PlayIcon, PauseIcon } from './icons';
import MarkdownRenderer from './MarkdownRenderer';

// --- NEW: Particle Stream Animator for "Cognitive Channeling" ---
interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number;
    size: number;
}

const MessageParticleStream: React.FC<{
    startRect: DOMRect | null;
    endRef: React.RefObject<HTMLDivElement>;
}> = ({ startRect, endRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        const endElement = endRef.current;
        if (!canvas || !endElement || !startRect) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const endRect = endElement.getBoundingClientRect();
        const startX = startRect.x + startRect.width / 2;
        const startY = startRect.y + startRect.height / 2;
        const endX = endRect.x + endRect.width / 2;
        const endY = endRect.y + endRect.height / 2;
        
        const particles: Particle[] = [];
        const numParticles = 60;

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: startX + (Math.random() - 0.5) * startRect.width * 0.5,
                y: startY,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 3, // Initial upward burst
                life: 1,
                size: Math.random() * 2 + 1,
            });
        }
        
        let animationFrameId: number;
        let startTime: number | null = null;
        const totalDuration = 800; // ms

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'hsla(220, 100%, 65%, 0.8)'; // accent1-glow

            particles.forEach(p => {
                const dx = endX - p.x;
                const dy = endY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                const ax = (dx / dist) * 0.3; 
                const ay = (dy / dist) * 0.3;
                
                p.vx += ax;
                p.vy += ay;
                
                p.vx *= 0.96; // Damping
                p.vy *= 0.96;
                
                p.x += p.vx;
                p.y += p.vy;
                
                p.life = 1 - (elapsed / totalDuration);
                
                if (p.life > 0) {
                    ctx.globalAlpha = p.life;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            
            ctx.globalAlpha = 1.0;
            
            if (elapsed < totalDuration) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setIsVisible(false);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };

    }, [startRect, endRef]);
    
    if (!isVisible) return null;
    
    return createPortal(
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />,
        document.body
    );
};


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
  isAudioPaused: boolean; // Is the currently playing audio paused?
  isTtsLoading: boolean; // Is this message's audio currently loading?
  inputRect: DOMRect | null; // The position of the chat input bar for animations.
  t: (key: string, fallback?: any) => any; // Translation function.
}

// UPGRADED: Thematic "typing..." indicator with cycling text.
const TypingIndicator: React.FC<{ t: (key: string, fallback?: any) => any }> = ({ t }) => {
    const [loadingText, setLoadingText] = useState('...');
    const loadingMessages = t('loading.thinking', []);

    useEffect(() => {
        if (!Array.isArray(loadingMessages) || loadingMessages.length === 0) return;

        const pickRandom = () => loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setLoadingText(pickRandom());

        const intervalId = setInterval(() => {
            setLoadingText(pickRandom());
        }, 2500); // Cycle text every 2.5 seconds

        return () => clearInterval(intervalId);
    }, [loadingMessages]);

    return (
        <div className="flex items-center gap-2 text-text-medium font-code text-sm p-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
            <span>{loadingText}</span>
        </div>
    );
};


// The main message component.
const MessageComponent: React.FC<MessageProps> = ({ 
    message, 
    isLastMessage,
    isAiLoading,
    onCopy, 
    onSpeak, 
    onRegenerate, 
    onStopGeneration,
    speakingMessageId,
    isAudioPaused,
    isTtsLoading,
    inputRect,
    t
}) => {
  const [isCopied, setIsCopied] = useState(false); // State for whether the text has been copied.
  const isUser = message.role === 'user'; // Checking if the message is from the user or the model.
  const isTyping = message.role === 'model' && !message.content && isAiLoading; // Checking if the AI is currently typing.
  const isSpeaking = speakingMessageId === message.id; // Checking if this message is being spoken.

  const messageRef = useRef<HTMLDivElement>(null);
  const isNewUserMessage = isLastMessage && isUser && !isAiLoading;


  // Classes for conditional styling.
  const containerClasses = `flex items-start gap-3 w-full group relative ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `px-4 py-3 rounded-2xl relative transition-shadow duration-300 max-w-3xl ${
    isUser
      ? 'bg-accent1/10 text-text-light rounded-br-none border border-accent1/50'
      : 'bg-primary/10 text-text-light rounded-bl-none border border-primary/50 glow-border'
  } ${isNewUserMessage ? 'new-message-bubble' : ''}`;

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
      <button 
        onClick={() => onSpeak(message)} 
        title="Speak" 
        className="p-1.5 rounded-full bg-input hover:bg-input-border transition-colors border border-card-border"
      >
        {isTtsLoading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        ) : isSpeaking ? (
            isAudioPaused ? (
                <PlayIcon className="w-4 h-4 text-primary" />
            ) : (
                <PauseIcon className="w-4 h-4 text-primary" />
            )
        ) : (
            <Volume2Icon className="w-4 h-4 text-text-medium" />
        )}
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
    <div className={containerClasses} ref={messageRef}>
      {/* Render the particle stream animation for the newest user message */}
      {isNewUserMessage && <MessageParticleStream startRect={inputRect} endRef={messageRef} />}
      
      {/* Show the logo with the model's message. */}
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-input flex items-center justify-center border border-input-border">
          <CognitoLogo className="h-6 w-6" />
        </div>
      )}
      <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div className={bubbleClasses}>
          {isTyping ? (
              <TypingIndicator t={t} />
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
       {/* NEW: Show the user icon with the user's message. */}
       {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-input flex items-center justify-center border border-input-border">
          <UserCircleIcon className="h-6 w-6 text-accent1" />
        </div>
      )}
    </div>
  );
};

export default MessageComponent;