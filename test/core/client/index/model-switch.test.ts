// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('Model switch behavior', () => {
  let component: CodeInspectorComponent;

  beforeEach(async () => {
    vi.clearAllMocks();
    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    if (component?.parentElement) {
      document.body.removeChild(component);
    }
    vi.clearAllMocks();
  });

  it('should keep chat context and messages when switching model', () => {
    component.availableAIModels = ['gpt-5-codex', 'gpt-5.1-codex'];
    component.chatModel = 'gpt-5-codex';
    component.chatSessionId = 'session-1';
    component.turnStatus = 'done';
    component.turnDuration = 12;
    component.chatMessages = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'world' },
    ];
    const originalMessages = [...component.chatMessages];

    component.switchChatModel('gpt-5.1-codex');

    expect(component.chatModel).toBe('gpt-5.1-codex');
    expect(component.chatSessionId).toBeNull();
    expect(component.turnStatus).toBe('idle');
    expect(component.turnDuration).toBe(0);
    expect(component.chatMessages).toEqual(originalMessages);
  });

  it('should toggle model menu and close provider menu', () => {
    component.availableAIModels = ['gpt-5-codex', 'gpt-5.1-codex'];
    component.showProviderMenu = true;

    component.toggleModelMenu();
    expect(component.showModelMenu).toBe(true);
    expect(component.showProviderMenu).toBe(false);

    component.toggleModelMenu();
    expect(component.showModelMenu).toBe(false);
  });

  it('should not switch model while a turn is running', () => {
    component.availableAIModels = ['gpt-5-codex', 'gpt-5.1-codex'];
    component.chatModel = 'gpt-5-codex';
    component.chatSessionId = 'session-1';
    component.chatLoading = true;

    component.switchChatModel('gpt-5.1-codex');

    expect(component.chatModel).toBe('gpt-5-codex');
    expect(component.chatSessionId).toBe('session-1');
  });
});

