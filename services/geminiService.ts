// REFACTOR: Import GoogleGenAI from the @google/genai SDK.
import { GoogleGenAI } from "@google/genai";
import type { Message } from '../types';

// REFACTOR: Initialize the GoogleGenAI client with the API key from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
// REFACTOR: Use 'gemini-2.5-flash' model.
const model = 'gemini-2.5-flash';

// REFACTOR: Re-implement getAiResponse to use the Gemini API's streaming chat.
export async function getAiResponse(
    history: Message[],
    newMessage: string,
    onStream: (chunk: string) => void
): Promise<void> {

    const systemInstruction = 'You are Cognito, a friendly and conversational AI assistant. Your personality is helpful, slightly witty, and you always provide clear, concise answers. Your goal is to assist users effectively with their tasks and questions.';
    
    // The history for ai.chats.create needs to be in a specific format.
    const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    const chat = ai.chats.create({
        model: model,
        history: geminiHistory,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    try {
        const responseStream = await chat.sendMessageStream({ message: newMessage });
        for await (const chunk of responseStream) {
            // Check if chunk and chunk.text exist before calling onStream
            if (chunk && chunk.text) {
              onStream(chunk.text);
            }
        }
    } catch (error) {
        console.error("Error sending message to Gemini API:", error);
        if (error instanceof Error) {
            // Propagate a user-friendly error message if possible
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unexpected error occurred with Gemini API. Please try again.");
    }
}

// REFACTOR: Re-implement getTitleForChat to use Gemini's generateContent for one-shot text generation.
export async function getTitleForChat(messages: Message[]): Promise<string> {
    if (messages.length < 2) return "New Conversation";
    
    const conversationForTitle = messages.slice(0, 2).map(m => `${m.role === 'user' ? 'User' : 'Cognito'}: ${m.content}`).join('\n');
    const prompt = `Generate a short, concise title (3-5 words) for this conversation:\n\n${conversationForTitle}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: 'You generate short, concise titles for conversations.',
                maxOutputTokens: 15,
                temperature: 0.2
            },
        });

        const title = response.text;

        return title ? title.replace(/["\.]/g, '').trim() : "New Conversation";
    } catch (error) {
        console.error("Error generating title with Gemini:", error);
        return "New Conversation";
    }
}
