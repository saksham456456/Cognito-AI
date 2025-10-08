
import type { Chat } from '../types';

// IndexedDB ke liye constants define kar rahe hain.
const DB_NAME = 'CognitoAI-DB'; // Database ka naam.
const DB_VERSION = 1; // Database ka version.
const CHATS_STORE_NAME = 'chats'; // "Table" ya object store ka naam.

// Database connection ko cache karne ke liye variable.
let db: IDBDatabase | null = null;

// Database connection ko kholne ya banane ke liye function.
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Agar connection pehle se hai, to wahi use karo.
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
        console.error("IndexedDB error:", request.error);
        reject(request.error);
    };
    
    request.onsuccess = () => {
      db = request.result;
      
      // Agar browser connection band kar de, to humara cached 'db' variable null ho jaye.
      db.onclose = () => {
        console.warn("Database connection browser ne band kar diya.");
        db = null;
      };

      resolve(db);
    };

    // Jab DB pehli baar banta hai ya version badalta hai, tab yeh chalta hai.
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      // Agar 'chats' object store nahi hai to use banate hain.
      if (!dbInstance.objectStoreNames.contains(CHATS_STORE_NAME)) {
        // 'id' ko key (primary key) ke roop me use kar rahe hain.
        dbInstance.createObjectStore(CHATS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Ek chat ko DB me save ya update karne ke liye function.
export async function saveChat(chat: Chat): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // 'readwrite' transaction shuru karte hain.
    const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE_NAME);
    // 'put' method naya record add karta hai ya purane ko (same key wala) update kar deta hai.
    const request = store.put(chat);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Saare chats ko DB se load karne ke liye function.
export async function loadChats(): Promise<Chat[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // 'readonly' transaction, kyunki hum sirf data padh rahe hain.
    const transaction = db.transaction(CHATS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CHATS_STORE_NAME);
    const request = store.getAll(); // Saare records nikalte hain.
    request.onsuccess = () => {
        // FIX: IndexedDB se mile result ka shallow copy banate hain sort karne se pehle.
        // Original result array ko direct modify karne se kuch browsers me "Illegal invocation" error aa sakta hai.
        const chats = [...request.result];
        // Chats ko ID ke hisab se descending order me sort karte hain (naya wala sabse upar).
        chats.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        resolve(chats);
    };
    request.onerror = () => reject(request.error);
  });
}

// Ek chat ko uski ID se delete karne ke liye function.
export async function deleteChat(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Saare chats ko object store se delete karne ke liye function.
export async function deleteAllChats(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.clear(); // Poora store khali kar deta hai.
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}