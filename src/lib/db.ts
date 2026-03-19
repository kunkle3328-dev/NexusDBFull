import { openDB, DBSchema } from 'idb';

export interface Source {
  id: string;
  type: 'document' | 'link';
  name: string;
  content?: string; // For text/links
  fileData?: string; // Base64 for PDFs
  mimeType?: string;
  url?: string;
  tags: string[];
  category: string;
  summary: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  audioData?: string; // Base64 audio if TTS was generated
  thinking?: string; // For ThinkingLevel.HIGH
}

export interface ChatSession {
  id: string;
  title: string;
  sourceIds: string[]; // Which sources this chat is grounded on
  messages: ChatMessage[];
  updatedAt: number;
}

interface KnowledgeDB extends DBSchema {
  sources: {
    key: string;
    value: Source;
    indexes: { 'by-category': string };
  };
  chats: {
    key: string;
    value: ChatSession;
    indexes: { 'by-updated': number };
  };
}

export const dbPromise = openDB<KnowledgeDB>('knowledge-base', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sources')) {
      const sourceStore = db.createObjectStore('sources', { keyPath: 'id' });
      sourceStore.createIndex('by-category', 'category');
    }
    
    if (!db.objectStoreNames.contains('chats')) {
      const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
      chatStore.createIndex('by-updated', 'updatedAt');
    }
  },
});
