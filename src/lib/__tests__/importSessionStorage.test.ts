import { beforeEach, describe, expect, it } from 'vitest';
import { clearImportSession, loadImportSession, saveImportSession } from '../importSessionStorage';
import type { ImportSession } from '../../types';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function makeSession(text = 'Built lifecycle engine'): ImportSession {
  return {
    id: 'session-1',
    mode: 'default',
    state: 'parsed',
    storage: 'localStorage',
    updatedAt: new Date().toISOString(),
    profileSuggestion: {
      targetRoles: ['Growth Marketing Manager'],
      locationHints: ['Remote'],
    },
    diagnostics: {
      extractedTextLength: text.length,
      detectedLinesCount: 10,
      bulletCandidatesCount: 3,
      sectionHeadersDetected: 1,
      companyCandidatesDetected: 1,
      roleCandidatesDetected: 1,
      finalCompaniesCount: 1,
      rolesCount: 1,
      bulletsCount: 2,
      reasonCodes: [],
      previewLines: ['Acme Corp', 'Growth Marketing Manager'],
    },
    draft: {
      companies: [
        {
          id: 'company-1',
          name: 'Acme Corp',
          confidence: 0.9,
          status: 'accepted',
          sourceRefs: [{ lineIndex: 0 }],
          roles: [
            {
              id: 'role-1',
              title: 'Growth Marketing Manager',
              startDate: 'Jan 2021',
              endDate: 'Present',
              confidence: 0.88,
              status: 'accepted',
              sourceRefs: [{ lineIndex: 1 }],
              highlights: [
                {
                  id: 'highlight-1',
                  type: 'highlight',
                  text,
                  confidence: 0.82,
                  status: 'accepted',
                  sourceRefs: [{ lineIndex: 2 }],
                },
              ],
              outcomes: [],
              tools: [],
              skills: [],
            },
          ],
        },
      ],
    },
  };
}

describe('importSessionStorage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: createMemoryStorage(),
      configurable: true,
    });
    localStorage.removeItem('jf2-import-session-v1');
    localStorage.removeItem('jf2-import-session-storage');
    sessionStorage.removeItem('jf2-import-session-v1');
    clearImportSession();
  });

  it('stores small sessions in localStorage', () => {
    const session = makeSession();
    const storage = saveImportSession(session);

    expect(storage).toBe('localStorage');
    expect(loadImportSession()?.id).toBe('session-1');
  });

  it('stores large sessions outside localStorage budget', () => {
    const session = makeSession('A'.repeat(260 * 1024));
    const storage = saveImportSession(session);

    expect(storage).toBe('sessionStorage');
    expect(localStorage.getItem('jf2-import-session-v1')).toBeNull();
    expect(loadImportSession()?.id).toBe('session-1');
  });

  it('clears stored sessions', () => {
    saveImportSession(makeSession());
    clearImportSession();

    expect(loadImportSession()).toBeNull();
    expect(localStorage.getItem('jf2-import-session-v1')).toBeNull();
  });
});
