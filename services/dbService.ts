import type { Chat } from '../types';

const DB_NAME = 'CognitoAI-DB';
const DB_VERSION = 1;
const CHATS_STORE_NAME = 'chats';

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
      
      db.onclose = () => {
        console.warn("Database connection closed by browser.");
        db = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(CHATS_STORE_NAME)) {
        dbInstance.createObjectStore(CHATS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveChat(chat: Chat): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE_NAME);
    const request = store.put(chat);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadChats(): Promise<Chat[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CHATS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CHATS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => parseInt(b.id) - parseInt(a.id)));
    request.onerror = () => reject(request.error);
  });
}

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

export async function deleteAllChats(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}