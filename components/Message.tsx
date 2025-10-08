
import React, { useState, useEffect, useRef } from 'react';
import type { Message } from '../types';
import { CognitoLogo } from './Logo';
import { ClipboardIcon, CheckIcon, Volume2Icon, RefreshIcon } from './icons';
import CodeBlock from './CodeBlock';

// Message component ke props ka interface define kar rahe hain.
interface MessageProps {
  message: Message; // Message object (id, role, content).
  isLastMessage: boolean; // Kya yeh chat ka aakhri message hai? (Regenerate button dikhane ke liye).
  onCopy: (text: string) => void; // Copy button ka function.
  onSpeak: (message: Message) => void; // Text-to-speech button ka function.
  onRegenerate: () => void; // Regenerate button ka function.
  onRunCode: (code: string) => void; // "Run in Py-Core" button ka function.
  speakingMessageId: string | null; // Currently bolne wale message ka ID.
}

// AI "typing..." indicator ke liye chhota sa component.
const PulsingOrbIndicator = () => (
    <div className="flex items-center justify-center p-2">
      <div className="h-4 w-4 bg-primary rounded-full animate-orb-pulse"></div>
    </div>
);

// Yeh component streaming text ko ek-ek character karke type hota hua dikhata hai.
// FIX: Buggy StreamedContent component ko a corrected version se replace kiya gaya hai.
// Naya implementation ek recursive timeout approach use karta hai useEffect ke andar
// ek smooth typing animation banane ke liye jo streaming text updates ko sahi se handle karta hai
// bina har naye chunk pe animation ko shuru se restart kiye.
const StreamedContent: React.FC<{ text: string, onRunCode: (code: string) => void, onCopy: (text: string) => void }> = ({ text, onRunCode, onCopy }) => {
    const [displayedText, setDisplayedText] = useState(''); // Screen pe dikhne wala text.
    const prevTextRef = useRef(''); // Pichla text, yeh check karne ke liye ki text regenerate hua hai ya continue.

    useEffect(() => {
        if (prevTextRef.current && !text.startsWith(prevTextRef.current)) {
            setDisplayedText('');
        }
        prevTextRef.current = text;
    }, [text]);

    useEffect(() => {
        if (displayedText.length === text.length) {
            return;
        }
        const timeoutId = setTimeout(() => {
            setDisplayedText(text.slice(0, displayedText.length + 1));
        }, 15);
        return () => clearTimeout(timeoutId);
    }, [text, displayedText]);

    // Regular expression to find Python code blocks
    const codeBlockRegex = /(```python\n)([\s\S]*?)(```)/g;
    const parts = displayedText.split(codeBlockRegex);

    // Agar text stream ho raha hai to cursor dikhao
    const showCursor = displayedText.length < text.length;

    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, index) => {
                if ((index - 2) % 4 === 0) { // This is the captured code content
                    const rawCode = part;
                    // Check if this is the last part and if we are still typing inside it.
                    const isStreamingThisBlock = showCursor && index === parts.length - 2;
                    return <CodeBlock key={index} code={rawCode} onCopy={onCopy} onRun={onRunCode} isStreaming={isStreamingThisBlock} />;
                } else if ((index - 1) % 4 !== 0 && (index - 3) % 4 !== 0) {
                     // This is regular text
                    return <span key={index}>{part}</span>;
                }
                return null; // This is ```python or ```, so we don't render it.
            })}
             {/* Blinking cursor sirf tab dikhao jab animation chal raha ho and it's not inside a code block. */}
            {showCursor && parts.length === 1 && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-cursor-blink" />}
        </div>
    );
};


// Main message component.
const MessageComponent: React.FC<MessageProps> = ({ message, isLastMessage, onCopy, onSpeak, onRegenerate, onRunCode, speakingMessageId }) => {
  const [isCopied, setIsCopied] = useState(false); // Text copy hua ya nahi, iska state.
  const isUser = message.role === 'user'; // Check kar rahe hain ki message user ka hai ya model ka.
  const isTyping = message.role === 'model' && !message.content; // Check kar rahe hain ki AI abhi type kar raha hai ya nahi.
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
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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
      {isLastMessage && (
        <button onClick={onRegenerate} title="Regenerate" className="p-1.5 rounded-full bg-input hover:bg-input-border transition-colors border border-card-border">
          <RefreshIcon className="w-4 h-4 text-text-medium" />
        </button>
      )}
    </div>
  );

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
          {isTyping ? <PulsingOrbIndicator /> : <StreamedContent text={message.content} onRunCode={onRunCode} onCopy={copyHandler} />}
        </div>
        {/* Model ke message par hover karne par actions dikhate hain. */}
        {!isUser && !isTyping && message.content && <MessageActions />}
      </div>
    </div>
  );
};

export default MessageComponent;
