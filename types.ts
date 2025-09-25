export type MessageRole = 'user' | 'model';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
}
