import type { ImportSession } from '../types';

const IMPORT_SESSION_STORAGE_KEY = 'jf2-import-session-v1';
const IMPORT_SESSION_POINTER_KEY = 'jf2-import-session-storage';
const MAX_LOCAL_STORAGE_BYTES = 250 * 1024;

let inMemorySession: ImportSession | null = null;

function getSerializedSize(serialized: string): number {
  return new Blob([serialized]).size;
}

export function saveImportSession(session: ImportSession): ImportSession['storage'] {
  const serialized = JSON.stringify(session);
  const size = getSerializedSize(serialized);

  try {
    if (size <= MAX_LOCAL_STORAGE_BYTES) {
      localStorage.setItem(IMPORT_SESSION_STORAGE_KEY, serialized);
      localStorage.setItem(IMPORT_SESSION_POINTER_KEY, 'localStorage');
      sessionStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
      inMemorySession = null;
      return 'localStorage';
    }
  } catch {
    // continue to session fallback
  }

  try {
    sessionStorage.setItem(IMPORT_SESSION_STORAGE_KEY, serialized);
    localStorage.setItem(IMPORT_SESSION_POINTER_KEY, 'sessionStorage');
    localStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
    inMemorySession = null;
    return 'sessionStorage';
  } catch {
    localStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
    localStorage.setItem(IMPORT_SESSION_POINTER_KEY, 'memory');
    inMemorySession = session;
    return 'memory';
  }
}

export function loadImportSession(): ImportSession | null {
  const preferred = localStorage.getItem(IMPORT_SESSION_POINTER_KEY);
  const readFromStorage = (storage: Storage): ImportSession | null => {
    const payload = storage.getItem(IMPORT_SESSION_STORAGE_KEY);
    if (!payload) return null;
    try {
      return JSON.parse(payload) as ImportSession;
    } catch {
      return null;
    }
  };

  if (preferred === 'localStorage') {
    return readFromStorage(localStorage);
  }

  if (preferred === 'sessionStorage') {
    return readFromStorage(sessionStorage);
  }

  if (preferred === 'memory') {
    return inMemorySession;
  }

  return readFromStorage(localStorage) ?? readFromStorage(sessionStorage) ?? inMemorySession;
}

export function clearImportSession(): void {
  localStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
  localStorage.removeItem(IMPORT_SESSION_POINTER_KEY);
  sessionStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
  inMemorySession = null;
}

export function getImportSessionStorageNotice(storage: ImportSession['storage']): string | null {
  if (storage === 'sessionStorage') {
    return 'Large import draft saved for this browser session.';
  }

  if (storage === 'memory') {
    return 'Large import draft kept in memory for this tab only.';
  }

  return null;
}
