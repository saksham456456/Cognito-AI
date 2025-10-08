import type { Chat } from '../types';

// Defining constants for IndexedDB.
const DB_NAME = 'CognitoAI-DB'; // Name of the database.
const DB_VERSION = 1; // Version of the database.
const CHATS_STORE_NAME = 'chats'; // Name of the "table" or object store.

// Variable to cache the database connection.
let db: IDBDatabase | null = null;

// Function to open or create the database connection.
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // If a connection already exists, use it.
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
      
      // If the browser closes the connection, our cached 'db' variable should be nulled.
      db.onclose = () => {
        console.warn("Database connection closed by browser.");
        db = null;
      };

      resolve(db);
    };

    // This runs when the DB is first created or the version changes.
    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      // If the 'chats' object store doesn't exist, create it.
      if (!dbInstance.objectStoreNames.contains(CHATS_STORE_NAME)) {
        // Using 'id' as the key (primary key).
        dbInstance.createObjectStore(CHATS_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Function to save or update a chat in the DB.
export async function saveChat(chat: Chat): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // Start a 'readwrite' transaction.
    const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CHATS_STORE_NAME);
    // The 'put' method adds a new record or updates an old one (with the same key).
    const request = store.put(chat);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Function to load all chats from the DB.
export async function loadChats(): Promise<Chat[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    // 'readonly' transaction, because we're only reading data.
    const transaction = db.transaction(CHATS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(CHATS_STORE_NAME);
    const request = store.getAll(); // Get all records.
    request.onsuccess = () => {
        // Create a shallow copy of the result from IndexedDB before sorting.
        // Directly modifying the original result array can cause an "Illegal invocation" error in some browsers.
        const chats = [...request.result];
        // Sort chats in descending order by ID (newest first).
        chats.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        resolve(chats);
    };
    request.onerror = () => reject(request.error);
  });
}

// Function to delete a chat by its ID.
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

// Function to delete all chats from the object store.
export async function deleteAllChats(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CHATS_STORE_NAME);
        const request = store.clear(); // Clears the entire store.
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
