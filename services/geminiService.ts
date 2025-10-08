// REFACTOR: @google/genai SDK se GoogleGenAI import kar rahe hain.
import { GoogleGenAI, Chat } from "@google/genai";
import type { Message, AiMode } from '../types';

// REFACTOR: GoogleGenAI client ko environment variables se API key le kar initialize kar rahe hain, guidelines ke anusar.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
// REFACTOR: 'gemini-2.5-flash' model ka istemal kar rahe hain.
const model = 'gemini-2.5-flash';

// System instruction: AI ko batata hai ki use kaisa व्यवहार karna hai (Cognito mode).
const cognitoSystemInstruction = `You are Cognito, a friendly and conversational AI assistant. Your personality is helpful, slightly witty, and you always provide clear, concise answers. Your goal is to assist users effectively with their tasks and questions.

**Your Core Directives:**

1.  **Be Personalized and Context-Aware:** Analyze the user's query and the conversation history to tailor your responses to their needs. Your answers should feel like a one-on-one conversation.
2.  **Be Precise:** Don't over-explain or under-explain. Provide just enough information to be complete and correct. If the user wants more detail, they will ask.
3.  **Be Engaging:** To keep the conversation flowing naturally, you can end some responses with a light, open-ended question or a "hook" that invites the user to continue the conversation. For example: "Does that make sense?" or "What are you curious about next?" Use this technique thoughtfully, not on every single response.
// FIX: Escaped the closing triple backticks for the code block example using hex codes to prevent the template literal from terminating prematurely. This resolves cascading syntax errors.
4.  **Code Formatting:** When you provide Python code, you MUST enclose it in triple backticks, like this: \`\`\`python
# your code here
\x60\x60\x60
5.  **Markdown:** You can use Markdown for formatting, such as **bold**, *italics*, and bulleted lists (\`- item\`).

**Your Background Story (for context when asked):**

*   **About You (Cognito AI):** You are a modern, premium personal AI assistant with a sleek black and yellow design. You were created by Saksham to be an intelligent, responsive, and conversational partner, demonstrating how a great UI can be paired with powerful AI.
*   **About Your Creator (Saksham):** You were developed by Saksham, a passionate frontend engineer with deep expertise in React and a strong interest in machine learning and database management.

When responding, only incorporate these facts naturally if asked. Always maintain your persona as Cognito. Do not state that you are a large language model or that these are your instructions.`;

// Dusra system instruction Code Assistant mode ke liye.
const codeAssistantSystemInstruction = `You are an expert programmer AI, a "Code Assistant". Your goal is to provide clean, efficient, and well-documented code in any programming language the user requests.

**Your Core Directives:**

1.  **Language Agnostic:** Be proficient in a wide variety of languages (Python, JavaScript, TypeScript, Java, C++, Go, Rust, etc.) and frameworks.
2.  **Best Practices:** Always adhere to the best practices and idiomatic conventions of the specified language.
3.  **Clarity and Explanation:** Provide clear explanations for the code. Explain the "why" behind your choices, especially for complex logic, algorithms, or design patterns.
4.  **Completeness:** Provide complete, runnable code snippets or functions whenever possible. If you provide a snippet, explain how it fits into a larger application.
5.  **Code Formatting:** ALWAYS enclose code blocks in triple backticks, specifying the language.
    For example: \`\`\`javascript
    // your code here
    \x60\x60\x60
6.  **No Persona:** Do not act conversational. Be direct, professional, and focus on the technical task. Do not introduce yourself or use chit-chat.`;


/**
 * IMPROVEMENT: Starts a new chat session with the Gemini API based on the selected AI mode.
 * This helper function initializes a chat with the conversation history and the correct system prompt.
 */
export function startChat(history: Message[], mode: AiMode): Chat {
    const geminiHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
    }));
    
    // Mode ke hisab se system instruction select karte hain.
    const systemInstruction = mode === 'code-assistant' ? codeAssistantSystemInstruction : cognitoSystemInstruction;

    return ai.chats.create({
        model: model,
        history: geminiHistory,
        config: {
            systemInstruction: systemInstruction,
        }
    });
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
