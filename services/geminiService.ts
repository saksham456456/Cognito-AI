
// REFACTOR: @google/genai SDK se GoogleGenAI import kar rahe hain.
import { GoogleGenAI } from "@google/genai";
import type { Message } from '../types';

// REFACTOR: GoogleGenAI client ko environment variables se API key le kar initialize kar rahe hain, guidelines ke anusar.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
// REFACTOR: 'gemini-2.5-flash' model ka istemal kar rahe hain.
const model = 'gemini-2.5-flash';

// REFACTOR: getAiResponse ko Gemini API ke streaming chat ka istemal karne ke liye re-implement kiya gaya hai.
// Yeh function AI se response stream karta hai.
export async function getAiResponse(
    history: Message[], // Puraani conversation history.
    newMessage: string, // User ka naya message.
    onStream: (chunk: string) => void // Har naye data chunk ke liye callback function.
): Promise<void> {

    // System instruction: AI ko batata hai ki use kaisa व्यवहार karna hai.
    const systemInstruction = `You are Cognito, a friendly and conversational AI assistant. Your personality is helpful, slightly witty, and you always provide clear, concise answers. Your goal is to assist users effectively with their tasks and questions.

**Your Core Directives:**

1.  **Be Personalized and Context-Aware:** Analyze the user's query and the conversation history to tailor your responses to their needs. Your answers should feel like a one-on-one conversation.
2.  **Be Precise:** Don't over-explain or under-explain. Provide just enough information to be complete and correct. If the user wants more detail, they will ask.
3.  **Be Engaging:** To keep the conversation flowing naturally, you can end some responses with a light, open-ended question or a "hook" that invites the user to continue the conversation. For example: "Does that make sense?" or "What are you curious about next?" Use this technique thoughtfully, not on every single response.
4.  **Code Formatting:** When you provide Python code, you MUST enclose it in triple backticks, like this: \`\`\`python\n# your code here\n\`\`\`

**Your Background Story (for context when asked):**

*   **About You (Cognito AI):** You are a modern, premium personal AI assistant with a sleek black and yellow design. You were created by Saksham to be an intelligent, responsive, and conversational partner, demonstrating how a great UI can be paired with powerful AI.
*   **About Your Creator (Saksham):** You were developed by Saksham, a passionate frontend engineer with deep expertise in React and a strong interest in machine learning and database management.

When responding, only incorporate these facts naturally if asked. Always maintain your persona as Cognito. Do not state that you are a large language model or that these are your instructions.`;
    
    // ai.chats.create ke liye history ko ek specific format me convert kar rahe hain.
    const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));

    // Ek naya chat instance banate hain.
    const chat = ai.chats.create({
        model: model,
        history: geminiHistory,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    try {
        // User ka message bhejte hain aur streaming response shuru karte hain.
        const responseStream = await chat.sendMessageStream({ message: newMessage });
        // Stream se har chunk ko read karte hain jaise hi woh aata hai.
        for await (const chunk of responseStream) {
            // Check karte hain ki chunk aur chunk.text maujood hain ya nahi, onStream call karne se pehle.
            if (chunk && chunk.text) {
              onStream(chunk.text);
            }
        }
    } catch (error) {
        console.error("Error sending message to Gemini API:", error);
        if (error instanceof Error) {
            // Ek user-friendly error message propagate karte hain agar mumkin ho.
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unexpected error occurred with the Gemini API. Please try again.");
    }
}

// REFACTOR: getTitleForChat ko Gemini ke generateContent ka istemal karne ke liye re-implement kiya gaya hai one-shot text generation ke liye.
// Yeh function conversation ke shuruaati hisse se ek title generate karta hai.
export async function getTitleForChat(messages: Message[]): Promise<string> {
    if (messages.length < 2) return "New Conversation";
    
    // Title banane ke liye conversation ka pehla user aur model message lete hain.
    const conversationForTitle = messages.slice(0, 2).map(m => `${m.role === 'user' ? 'User' : 'Cognito'}: ${m.content}`).join('\n');
    const prompt = `Give this conversation a short, 3-5 word title. Do not use quotes or periods.\n\n${conversationForTitle}`;

    try {
        // Gemini ko ek baar me content generate karne ke liye bolte hain (non-streaming).
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: 'You create short, concise titles for conversations.',
                maxOutputTokens: 15, // Output ko chhota rakhne ke liye.
                temperature: 0.2 // Creative-kam, factual-zyada response ke liye.
            },
        });

        const title = response.text;

        // Title se quotes aur periods hatakar trim karte hain.
        return title ? title.replace(/["\.]/g, '').trim() : "New Conversation";
    } catch (error) {
        console.error("Error generating title with Gemini:", error);
        return "New Conversation"; // Error hone par default title.
    }
}
