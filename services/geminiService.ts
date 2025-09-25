import { GoogleGenAI, type Chat } from "@google/genai";
import type { Message } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

export async function getAiResponse(
    history: Message[],
    newMessage: string,
    onStream: (chunk: string) => void
): Promise<void> {
    const chatHistory = history.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }]
    }));

    try {
        const chat: Chat = ai.chats.create({
            model,
            history: chatHistory,
            config: {
                systemInstruction: 'You are Cognito, a friendly and conversational AI assistant. Your personality is helpful, slightly witty, and you always provide clear, concise answers. Your goal is to assist users effectively with their tasks and questions.',
            },
        });
        const stream = await chat.sendMessageStream({ message: newMessage });
        for await (const chunk of stream) {
            onStream(chunk.text);
        }
    } catch (error) {
        console.error("Error sending message to Gemini API:", error);
        onStream("Sorry, I encountered an error. Please try again.");
    }
}

export async function getTitleForChat(messages: Message[]): Promise<string> {
    if (messages.length < 2) return "New Conversation";
    
    const conversationForTitle = messages.slice(0, 2).map(m => `${m.role === 'user' ? 'User' : 'Cognito'}: ${m.content}`).join('\n');
    const prompt = `Generate a short, concise title (3-5 words) for this conversation:\n\n${conversationForTitle}`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{text: prompt}] }],
        });
        
        return response.text.replace(/["\.]/g, '').trim();
    } catch (error) {
        console.error("Error generating title:", error);
        return "New Conversation";
    }
}