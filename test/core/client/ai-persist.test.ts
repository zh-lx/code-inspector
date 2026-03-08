import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAIState, loadAIState, saveAIState, type PersistedAIState } from '@/core/src/client/ai-persist';

const sampleState: PersistedAIState = {
  showChatModal: true,
  chatMessages: [{ role: 'assistant', content: [{ type: 'text', text: 'hi' }] } as any],
  chatContext: null,
  chatSessionId: 's1',
  chatTheme: 'light',
  chatModel: 'm1',
  availableAIModels: ['m1'],
  chatProvider: 'codex',
  availableAIProviders: ['codex'],
  modalPosition: { left: '10px', top: '20px' },
  turnStatus: 'idle',
};

describe('ai-persist', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('should save and load state', () => {
    saveAIState(sampleState);
    expect(loadAIState()).toEqual(sampleState);
  });

  it('should return null when no saved state', () => {
    expect(loadAIState()).toBeNull();
  });

  it('should return null for invalid json', () => {
    sessionStorage.setItem('__code_inspector_ai_state__', '{bad-json');
    expect(loadAIState()).toBeNull();
  });

  it('should clear saved state', () => {
    saveAIState(sampleState);
    clearAIState();
    expect(loadAIState()).toBeNull();
  });

  it('should swallow storage errors in save/load/clear', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('set failed');
    });
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('get failed');
    });
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove failed');
    });

    expect(() => saveAIState(sampleState)).not.toThrow();
    expect(loadAIState()).toBeNull();
    expect(() => clearAIState()).not.toThrow();

    expect(setSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
});
