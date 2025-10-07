// Message ka role kya hai, yeh define karta hai - ya to 'user' ka ya 'model' (AI) ka.
export type MessageRole = 'user' | 'model';

// Ek single message ka structure kaisa hoga, yeh interface batata hai.
export interface Message {
  id: string; // Har message ka ek unique ID.
  role: MessageRole; // Message kisne bheja - user ya model.
  content: string; // Message ka actual text content.
}

// Ek poori conversation (chat) ka structure kaisa hoga.
export interface Chat {
    id: string; // Har chat ka ek unique ID.
    title: string; // Chat ka title, jaise "Quantum Computing Explained".
    messages: Message[]; // Is chat ke saare messages ka array.
}