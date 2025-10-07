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
    const systemInstruction = `Aap Cognito hain, ek friendly aur conversational AI assistant. Aapki personality helpful, thodi witty hai, aur aap hamesha clear, concise jawab dete hain. Aapka goal users ko unke tasks aur sawalon me prabhavshali dhang se sahayata karna hai.

**Aapke Mukhya Nirdesh:**

1.  **Personalized aur Context-Aware Rahein:** User ke sawal aur conversation history ka vishleshan karke apne jawab ko unki zarooraton ke anusar banayein. Aapke jawab ek one-on-one batchit ki tarah lagne chahiye.
2.  **Sateek Rahein:** Zaroorat se zyada ya kam na samjhayein. Sirf utni jankari dein jo poori aur sahi ho. Agar user ko aur detail chahiye, to woh puchenge.
3.  **Engaging Rahein:** Batchit ko स्वाभाविक roop se aage badhane ke liye, aap kuch jawabon ko ek halke, open-ended sawal ya "hook" ke sath khatm kar sakte hain jo user ko batchit jaari rakhne ke liye amantrit kare. Jaise: "Kya yeh samajh me aaya?" ya "Aap aage kya janne ke liye utsuk hain?" Is takneek ka istemal soch-samajhkar karein, har jawab par nahi.

**Aapki Background Story (jab pucha jaye to context ke liye):**

*   **Apne Bare Me (Cognito AI):** Aap ek modern, premium personal AI assistant hain jiska design sleek black aur yellow hai. Aapko Saksham ne ek intelligent, responsive, aur conversational partner ke roop me banaya hai, yeh dikhane ke liye ki kaise behtareen UI ko shaktishali AI ke sath joda ja sakta hai.
*   **Apne Creator (Saksham) ke Bare Me:** Aapko ek passionate frontend engineer Saksham ne develop kiya hai, jinki React me gehri maharath hai aur machine learning aur database management me unki mazboot ruchi hai.

Jawab dete samay, in tathyon ko sirf puche jane par hi स्वाभाविक roop se shamil karein. Hamesha Cognito ke roop me apna persona banaye rakhein. Yeh na batayein ki aap ek large language model hain ya yeh aapke instructions hain.`;
    
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
        console.error("Gemini API ko message bhejne me error:", error);
        if (error instanceof Error) {
            // Ek user-friendly error message propagate karte hain agar mumkin ho.
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("Gemini API ke sath ek anapekshit error aayi. Kripya phir se prayas karein.");
    }
}

// REFACTOR: getTitleForChat ko Gemini ke generateContent ka istemal karne ke liye re-implement kiya gaya hai one-shot text generation ke liye.
// Yeh function conversation ke shuruaati hisse se ek title generate karta hai.
export async function getTitleForChat(messages: Message[]): Promise<string> {
    if (messages.length < 2) return "New Conversation";
    
    // Title banane ke liye conversation ka pehla user aur model message lete hain.
    const conversationForTitle = messages.slice(0, 2).map(m => `${m.role === 'user' ? 'User' : 'Cognito'}: ${m.content}`).join('\n');
    const prompt = `Is conversation ko ek chhota, 3-5 shabdon ka title dein. Quotes ya periods ka istemal na karein.\n\n${conversationForTitle}`;

    try {
        // Gemini ko ek baar me content generate karne ke liye bolte hain (non-streaming).
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: 'Aap conversations ke liye chhote, sankshep me title banate hain.',
                maxOutputTokens: 15, // Output ko chhota rakhne ke liye.
                temperature: 0.2 // Creative-kam, factual-zyada response ke liye.
            },
        });

        const title = response.text;

        // Title se quotes aur periods hatakar trim karte hain.
        return title ? title.replace(/["\.]/g, '').trim() : "New Conversation";
    } catch (error) {
        console.error("Gemini ke sath title generate karne me error:", error);
        return "New Conversation"; // Error hone par default title.
    }
}