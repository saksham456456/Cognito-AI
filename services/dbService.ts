import type { Chat } from '../types';

const DB_NAME = 'CognitoAI_DB';
const DB_VERSION = 1;
const CHATS_STORE_NAME = 'chats';

let db: IDBDatabase;

function getDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("Error opening IndexedDB:", request.error);
            reject("Error opening IndexedDB");
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(CHATS_STORE_NAME)) {
                db.createObjectStore(CHATS_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

export async function getAllChats(): Promise<Chat[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            // Sort by ID (timestamp) descending to show newest first
            const sortedChats = request.result.sort((a, b) => b.id.localeCompare(a.id));
            resolve(sortedChats);
        };
    });
}

export async function saveChat(chat: Chat): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.put(chat);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function deleteChat(chatId: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.delete(chatId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function deleteAllChats(): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}


/**
 * Migrates chats from localStorage to IndexedDB if they exist.
 * This is a one-time operation.
 */
export async function migrateFromLocalStorage() {
    const savedChatsRaw = localStorage.getItem('cognito-chats');
    if (savedChatsRaw) {
        try {
            const chats: Chat[] = JSON.parse(savedChatsRaw);
            if (Array.isArray(chats) && chats.length > 0) {
                console.log("Migrating chats from localStorage to IndexedDB...");
                const db = await getDb();
                const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(CHATS_STORE_NAME);
                chats.forEach(chat => store.put(chat));
                
                // Clear localStorage after successful migration
                localStorage.removeItem('cognito-chats');
                console.log("Successfully migrated chats.");
            } else {
                 // If localStorage has empty array or invalid data, just remove it
                 localStorage.removeItem('cognito-chats');
            }
        } catch (e) {
            console.error("Failed to parse or migrate chats from localStorage:", e);
            // In case of error, remove the corrupted data to prevent future issues
            localStorage.removeItem('cognito-chats');
        }
    }
}