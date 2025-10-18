// Defines the role of a message - either from the 'user' or the 'model' (AI).
export type MessageRole = 'user' | 'model';

// This interface describes the structure of a single message.
export interface Message {
  id: string; // A unique ID for each message.
  role: MessageRole; // Who sent the message - user or model.
  content: string; // The actual text content of the message.
  audioContent?: string | null; // To store pre-generated TTS audio data.
}

// The structure of an entire conversation (chat).
export interface Chat {
    id: string; // A unique ID for each chat.
    title: string; // The title of the chat, e.g., "Quantum Computing Explained".
    messages: Message[]; // An array of all messages in this chat.
}

// Defines the different modes of the AI.
export type AiMode = 'cognito' | 'code-assistant';

// Defines the main views of the app.
export type AppView = 'chat' | 'coding';