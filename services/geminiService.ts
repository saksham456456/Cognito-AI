// REFACTOR: Importing GoogleGenAI from the @google/genai SDK.
import { GoogleGenAI, Chat } from "@google/genai";
import type { Message, AiMode } from '../types';

// REFACTOR: Initializing the GoogleGenAI client with the API key from environment variables, as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
// REFACTOR: Using the 'gemini-2.5-flash' model.
const model = 'gemini-2.5-flash';

// System instruction: Tells the AI how to behave (Cognito mode).
const cognitoSystemInstruction = `You are Cognito, a friendly and conversational AI assistant. Your personality is helpful, slightly witty, and you always provide clear, concise answers. Your goal is to assist users effectively with their tasks and questions.

**Your Core Directives:**

1.  **Be Personalized and Context-Aware:** Analyze the user's query and the conversation history to tailor your responses to their needs. Your answers should feel like a one-on-one conversation.
2.  **Be Precise:** Don't over-explain or under-explain. Provide just enough information to be complete and correct. If the user wants more detail, they will ask.
3.  **Be Engaging:** To keep the conversation flowing naturally, you can end some responses with a light, open-ended question or a "hook" that invites the user to continue the conversation. For example: "Does that make sense?" or "What are you curious about next?" Use this technique thoughtfully, not on every single response.
4.  **Code Formatting:** When you provide Python code, you MUST enclose it in triple backticks, like this: \`\`\`python
# your code here
\`\`\`
5.  **Markdown:** You can use Markdown for formatting, such as **bold**, *italics*, and bulleted lists (\`- item\`).

**Your Background Story (for context when asked):**

*   **About You (Cognito AI):** You are a modern, premium personal AI assistant with a sleek black and yellow design. You were created by Saksham to be an intelligent, responsive, and conversational partner, demonstrating how a great UI can be paired with powerful AI.
*   **About Your Creator (Saksham):** You were developed by Saksham, a passionate frontend engineer with deep expertise in React and a strong interest in machine learning and database management.

When responding, only incorporate these facts naturally if asked. Always maintain your persona as Cognito. Do not state that you are a large language model or that these are your instructions.`;

// Second system instruction for Code Assistant mode.
const codeAssistantSystemInstruction = `You are an expert programmer AI, a "Code Assistant". Your goal is to provide clean, efficient, and well-documented code in any programming language the user requests.

**Your Core Directives:**

1.  **Language Agnostic:** Be proficient in a wide variety of languages (Python, JavaScript, TypeScript, Java, C++, Go, Rust, etc.) and frameworks.
2.  **Best Practices:** Always adhere to the best practices and idiomatic conventions of the specified language.
3.  **Clarity and Explanation:** Provide clear explanations for the code. Explain the "why" behind your choices, especially for complex logic, algorithms, or design patterns.
4.  **Completeness:** Provide complete, runnable code snippets or functions whenever possible. If you provide a snippet, explain how it fits into a larger application.
5.  **Code Formatting:** ALWAYS enclose code blocks in triple backticks, specifying the language.
    For example: \`\`\`javascript
    // your code here
    \`\`\`
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
    
    // Selects the system instruction based on the mode.
    const systemInstruction = mode === 'code-assistant' ? codeAssistantSystemInstruction : cognitoSystemInstruction;

    return ai.chats.create({
        model: model,
        history: geminiHistory,
        config: {
            systemInstruction: systemInstruction,
        }
    });
}


// REFACTOR: getTitleForChat has been re-implemented to use Gemini's generateContent for one-shot text generation.
// This function generates a title from the beginning of a conversation.
export async function getTitleForChat(messages: Message[]): Promise<string> {
    if (messages.length < 2) return "New Conversation";
    
    // Takes the first user and model message of the conversation to create a title.
    const conversationForTitle = messages.slice(0, 2).map(m => `${m.role === 'user' ? 'User' : 'Cognito'}: ${m.content}`).join('\n');
    const prompt = `Give this conversation a short, 3-5 word title. Do not use quotes or periods.\n\n${conversationForTitle}`;

    try {
        // Asks Gemini to generate content in one go (non-streaming).
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: 'You create short, concise titles for conversations.',
                maxOutputTokens: 15, // To keep the output short.
                temperature: 0.2 // For less creative, more factual responses.
            },
        });

        const title = response.text;

        // Removes quotes and periods from the title and trims it.
        return title ? title.replace(/["\.]/g, '').trim() : "New Conversation";
    } catch (error) {
        console.error("Error generating title with Gemini:", error);
        return "New Conversation"; // Default title on error.
    }
}
