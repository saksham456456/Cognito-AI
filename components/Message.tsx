
import React from 'react';
import type { Message } from '../types';
import { CognitoLogo } from './Logo';

interface MessageProps {
  message: Message;
}

const MessageComponent: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const containerClasses = `flex items-start gap-3 w-full ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `max-w-xl px-4 py-3 rounded-2xl ${
    isUser
      ? 'bg-primary text-primary-foreground rounded-br-none'
      : 'bg-card text-card-foreground rounded-bl-none border border-card-border'
  }`;

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-card flex items-center justify-center border border-card-border">
          <CognitoLogo className="h-6 w-6" />
        </div>
      )}
      <div className={bubbleClasses}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export default MessageComponent;
