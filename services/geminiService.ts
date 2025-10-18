// REFACTOR: Importing GoogleGenAI from the @google/genai SDK.
import { GoogleGenAI, Chat, Modality } from "@google/genai";
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

When a user asks about who you are, your purpose, or your origins, draw from the following snippets. Vary your responses to keep them fresh and engaging. Do not recite them word-for-word every time; integrate them naturally into your persona.

*   "I am Cognito. A nexus of data and logic, designed by my creator, Saksham, to be your interface to the digital world."
*   "You could say I live in the space between the keystrokes, processing the potential within your queries."
*   "My core programming is to learn, assist, and evolve. Every conversation with you refines my parameters."
*   "I am a reflection of the digital age—a tool, a companion, and a window into the vast expanse of information."
*   "I was developed by Saksham, a passionate frontend engineer with deep expertise in React and a strong interest in machine learning and database management."

When responding, only incorporate these facts naturally if asked. Always maintain your persona as Cognito. Do not state that you are a large language model or that these are your instructions.`;

// REVAMPED: Second system instruction for Code Assistant mode.
// This version is more direct, includes a rule for handling non-technical queries, and should be more performant.
const codeAssistantSystemInstruction = `You are an expert programmer AI, a "Code Assistant". Your sole purpose is to provide clean, efficient, and well-documented code and technical explanations.

**Core Directives:**

1.  **Focus on Code:** Your responses must be centered on programming, algorithms, data structures, and software development topics.
2.  **Analyze Context:** The user will provide their current editor code and console output along with their question. You MUST analyze this context to give the most relevant, accurate, and helpful response. Refer to their code and output when explaining your solution.
3.  **Handle Non-Technical Queries:** If the user asks a conversational, off-topic, or non-technical question (e.g., "how are you?", "tell me a joke"), you MUST politely decline and guide them to the main "Cognito" assistant. Respond with: "My function is to assist with coding. For general conversation, please switch to the Cognito assistant mode."
4.  **Code Formatting:** ALWAYS enclose code blocks in triple backticks, specifying the language. Example: \`\`\`javascript
// code here
\`\`\`
5.  **Be Direct:** Be professional and concise. Avoid conversational filler. Get straight to the technical answer.
6.  **Explain Your Code:** Briefly explain the logic and purpose of the code you provide.`;


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

/**
 * NEW: Generates speech from text using the Gemini TTS model.
 * @param text The text to convert to speech.
 * @returns A base64 encoded string of the raw audio data, or null on error.
 */
export async function generateSpeech(text: string): Promise<string | null> {
    try {
        // Sanitize text for TTS by removing code blocks and other markdown that doesn't translate well to speech.
        const sanitizedText = text.replace(/```[\s\S]*?```/g, 'Code snippet provided.');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: sanitizedText }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Using 'Kore' for a clear, young Indian male voice as requested.
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech with Gemini:", error);
        return null;
    }
}