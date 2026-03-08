// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSendChatToServer = vi.hoisted(() => vi.fn(async () => {}));
const mockFetchModelInfo = vi.hoisted(() =>
  vi.fn(async () => ({
    model: 'gpt-5-codex',
    models: ['gpt-5-codex', 'gpt-5.1-codex'],
    provider: 'codex',
    providers: ['codex', 'claudeCode'],
  })),
);
const mockUpdateChatModalPosition = vi.hoisted(() => vi.fn(() => null));
const mockSaveAIState = vi.hoisted(() => vi.fn());
const mockLoadAIState = vi.hoisted(() => vi.fn(() => null));
const mockClearAIState = vi.hoisted(() => vi.fn());

vi.mock('@/core/src/client/ai', async () => {
  const actual = await vi.importActual<any>('@/core/src/client/ai');
  return {
    ...actual,
    sendChatToServer: mockSendChatToServer,
    fetchModelInfo: mockFetchModelInfo,
    updateChatModalPosition: mockUpdateChatModalPosition,
  };
});

vi.mock('@/core/src/client/ai-persist', () => ({
  saveAIState: mockSaveAIState,
  loadAIState: mockLoadAIState,
  clearAIState: mockClearAIState,
}));

import { CodeInspectorComponent } from '@/core/src/client';

describe('client index ai interactions', () => {
  let component: CodeInspectorComponent;
  let rafSpy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:test'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(() => undefined),
      configurable: true,
    });

    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    rafSpy?.mockRestore();
    vi.restoreAllMocks();
    if (component?.parentElement) {
      document.body.removeChild(component);
    }
  });

  it('should toggle ai action and persist state with modal position', () => {
    component.internalLocate = true;
    component.internalCopy = true;
    component.internalTarget = true;
    component.toggleAICode();
    expect(component.internalAI).toBe(true);
    expect(component.internalLocate).toBe(false);
    expect(component.internalCopy).toBe(false);
    expect(component.internalTarget).toBe(false);

    component.chatMessages = [
      { role: 'user', content: 'q', modelContent: 'model-q' } as any,
      { role: 'assistant', content: 'a' } as any,
    ];
    component.showChatModal = true;
    const modal = document.createElement('div');
    modal.id = 'chat-modal-floating';
    modal.style.left = '10px';
    modal.style.top = '20px';
    component.shadowRoot?.appendChild(modal);

    (component as any).persistAIState();

    expect(mockSaveAIState).toHaveBeenCalledTimes(1);
    const payload = mockSaveAIState.mock.calls[0][0];
    expect(payload.modalPosition).toEqual({ left: '10px', top: '20px' });
    expect(payload.chatMessages[0].modelContent).toBeUndefined();
  });

  it('should refresh provider/model and switch provider/model menus correctly', async () => {
    await (component as any).refreshChatProviderAndModel('codex', 'gpt-5.1-codex');
    expect(component.availableAIProviders).toEqual(['codex', 'claudeCode']);
    expect(component.chatProvider).toBe('codex');
    expect(component.chatModel).toBe('gpt-5.1-codex');

    component.availableAIProviders = ['codex', 'claudeCode'];
    component.showModelMenu = true;
    component.toggleProviderMenu();
    expect(component.showProviderMenu).toBe(true);
    expect(component.showModelMenu).toBe(false);

    component.availableAIModels = ['gpt-5-codex', 'gpt-5.1-codex'];
    component.showProviderMenu = true;
    component.toggleModelMenu();
    expect(component.showModelMenu).toBe(true);
    expect(component.showProviderMenu).toBe(false);

    const refreshSpy = vi
      .spyOn(component as any, 'refreshChatProviderAndModel')
      .mockResolvedValue(undefined);
    const persistSpy = vi.spyOn(component as any, 'persistAIState');
    component.chatProvider = 'codex';
    component.switchChatProvider('claudeCode');
    expect(component.chatProvider).toBe('claudeCode');
    expect(component.chatSessionId).toBeNull();
    expect(refreshSpy).toHaveBeenCalledWith('claudeCode');
    expect(persistSpy).toHaveBeenCalled();

    component.chatLoading = true;
    component.switchChatProvider('codex');
    expect(component.chatProvider).toBe('claudeCode');

    component.chatLoading = false;
    component.availableAIModels = ['gpt-5-codex', 'gpt-5.1-codex'];
    component.chatModel = 'gpt-5-codex';
    component.switchChatModel('gpt-5.1-codex');
    expect(component.chatModel).toBe('gpt-5.1-codex');
    expect(component.chatSessionId).toBeNull();
  });

  it('should open and close chat modal in global mode', async () => {
    const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});
    const persistSpy = vi.spyOn(component as any, 'persistAIState');
    const closeSpy = vi.spyOn(component as any, 'performCloseChatModal');

    const modal = document.createElement('div');
    modal.id = 'chat-modal-floating';
    Object.defineProperty(modal, 'getBoundingClientRect', {
      value: () => ({ width: 300, height: 200 }),
    });
    const querySpy = vi
      .spyOn(component.shadowRoot as ShadowRoot, 'querySelector')
      .mockImplementation((selector: any) => {
        if (selector === '#chat-modal-floating') return modal as any;
        return null;
      });

    component.openChatModal(true);
    await component.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(removeCoverSpy).toHaveBeenCalledWith(true);
    expect(component.showChatModal).toBe(true);
    expect(component.chatContext).toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
    expect(persistSpy).toHaveBeenCalled();

    component.chatLoading = true;
    component.closeChatModal();
    expect(component.showCloseConfirm).toBe(true);

    component.confirmCloseChatModal();
    expect(closeSpy).toHaveBeenCalled();

    querySpy.mockRestore();
  });

  it('should handle drag operations and overlay/modal clicks', () => {
    component.showProviderMenu = true;
    component.showModelMenu = true;
    const modal = document.createElement('div');
    modal.id = 'chat-modal-floating';
    Object.defineProperty(modal, 'offsetLeft', { value: 40 });
    Object.defineProperty(modal, 'offsetTop', { value: 60 });
    Object.defineProperty(modal, 'getBoundingClientRect', {
      value: () => ({ width: 200, height: 120 }),
    });
    vi.spyOn(component.shadowRoot as ShadowRoot, 'querySelector').mockImplementation((selector: any) => {
      if (selector === '#chat-modal-floating') return modal as any;
      if (selector === '.chat-modal-content') return modal as any;
      return null;
    });

    component.handleChatDragStart({ button: 0, clientX: 50, clientY: 70, target: document.createElement('div'), preventDefault: vi.fn() } as any);
    expect(component.isDragging).toBe(true);

    Object.defineProperty(document.documentElement, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });
    component.handleChatDragMove({ clientX: 80, clientY: 110 } as any);
    expect(modal.style.left).toMatch(/px$/);
    expect(modal.style.top).toMatch(/px$/);

    const persistSpy = vi.spyOn(component as any, 'persistAIState');
    component.handleChatDragEnd();
    expect(component.isDragging).toBe(false);
    expect(persistSpy).toHaveBeenCalled();

    const closeSpy = vi.spyOn(component, 'closeChatModal').mockImplementation(() => {});
    component.wasDragging = false;
    component.handleOverlayClick();
    expect(closeSpy).toHaveBeenCalled();

    const stopPropagation = vi.fn();
    component.showProviderMenu = true;
    component.showModelMenu = true;
    component.handleChatModalClick({ target: document.createElement('div'), stopPropagation } as any);
    expect(stopPropagation).toHaveBeenCalled();
    expect(component.showProviderMenu).toBe(false);
    expect(component.showModelMenu).toBe(false);
  });

  it('should process pasted images and remove image by id', async () => {
    const notificationSpy = vi.spyOn(component, 'showNotification').mockImplementation(() => {});
    const readSpy = vi
      .spyOn(component as any, 'readFileAsDataUrl')
      .mockResolvedValueOnce('data:image/png;base64,a')
      .mockRejectedValueOnce(new Error('bad'));

    const okFile = new File(['hello'], 'a.png', { type: 'image/png' });
    const badFile = new File(['bad'], 'b.png', { type: 'image/png' });
    const event = {
      clipboardData: {
        items: [
          { type: 'image/png', getAsFile: () => okFile },
          { type: 'image/png', getAsFile: () => badFile },
        ],
      },
      preventDefault: vi.fn(),
    } as any;

    await component.handleChatPaste(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(readSpy).toHaveBeenCalledTimes(2);
    expect(component.chatPastedImages.length).toBe(1);
    expect(notificationSpy).toHaveBeenCalledWith('Failed to read pasted image', 'error');

    const id = component.chatPastedImages[0].id;
    component.removePastedImage(id);
    expect(component.chatPastedImages).toHaveLength(0);
  });

  it('should send chat message and handle streaming updates', async () => {
    const persistSpy = vi.spyOn(component as any, 'persistAIState');
    component.ip = '127.0.0.1';
    component.port = 5678;
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatInput = 'hello';
    component.chatContext = { name: 'Button', file: 'src/a.ts', line: 1, column: 1 };

    mockSendChatToServer.mockImplementationOnce(async (_ip: any, _port: any, _message: any, _context: any, _history: any, handlers: any) => {
      handlers.onSessionId?.('sid-1');
      handlers.onText('A');
      handlers.onToolStart('t1', 'Read', 1);
      handlers.onToolInput(1, { file: 'a.ts' }, 't1');
      handlers.onToolResult('t1', 'done', false);
      handlers.onModel?.('gpt-5.1-codex');
      handlers.onProjectRoot?.('/project');
    });

    await component.sendChatMessage();

    expect(mockSendChatToServer).toHaveBeenCalledTimes(1);
    expect(component.chatSessionId).toBe('sid-1');
    expect(component.chatMessages.length).toBeGreaterThanOrEqual(2);
    expect(component.chatLoading).toBe(false);
    expect(component.turnStatus).toBe('done');
    expect(persistSpy).toHaveBeenCalled();
  });

  it('should clear messages, interrupt and toggle theme', () => {
    component.chatMessages = [
      { role: 'user', content: 'x', images: [{ id: '1', name: 'a', type: 'image/png', size: 1, previewUrl: 'blob:x' }] },
    ] as any;
    component.chatPastedImages = [
      { id: '2', name: 'b', type: 'image/png', size: 1, previewUrl: 'blob:y', dataUrl: 'data:image/png;base64,a' },
    ] as any;
    component.clearChatMessages();
    expect(component.chatMessages).toEqual([]);
    expect(component.chatSessionId).toBeNull();

    const abort = vi.fn();
    component.chatAbortController = { abort } as any;
    component.interruptChat();
    expect(abort).toHaveBeenCalled();
    expect(component.turnStatus).toBe('interrupt');

    component.chatTheme = 'dark';
    component.toggleTheme();
    expect(component.chatTheme).toBe('light');
  });

  it('should cover ai helper private methods and context resolution', async () => {
    expect((component as any).formatBytes(100)).toBe('100B');
    expect((component as any).formatBytes(2048)).toBe('2.0KB');
    expect((component as any).formatBytes(3 * 1024 * 1024)).toBe('3.0MB');

    const messageOnly = (component as any).buildMessageWithPastedImages(' hello ', []);
    expect(messageOnly).toBe(' hello ');

    const mixedMessage = (component as any).buildMessageWithPastedImages(' hello ', [
      {
        id: 'img-1',
        name: 'a.png',
        type: 'image/png',
        size: 2048,
        previewUrl: 'blob:a',
        dataUrl: 'data:image/png;base64,a',
      },
    ]);
    expect(mixedMessage).toContain('[Pasted Image 1] a.png (image/png, 2.0KB)');
    expect(mixedMessage).toContain('data:image/png;base64,a');

    const imageOnlyMessage = (component as any).buildMessageWithPastedImages('   ', [
      {
        id: 'img-2',
        name: '',
        type: '',
        size: 10,
        previewUrl: 'blob:b',
        dataUrl: 'data:image/png;base64,b',
      },
    ]);
    expect(imageOnlyMessage).toContain('[Pasted Image 1] pasted-image-1 (image, 10B)');

    const history = (component as any).buildChatHistoryForModel([
      { role: 'user', content: 'q', modelContent: 'model-q' },
      { role: 'assistant', content: 'a' },
    ]);
    expect(history).toEqual([
      { role: 'user', content: 'model-q' },
      { role: 'assistant', content: 'a' },
    ]);

    component.targetNode = null;
    expect((component as any).resolveActiveChatContext()).toBeNull();

    component.targetNode = document.createElement('div');
    vi.spyOn(component as any, 'getSourceInfo').mockReturnValueOnce(null);
    expect((component as any).resolveActiveChatContext()).toBeNull();

    vi.spyOn(component as any, 'getSourceInfo').mockReturnValueOnce({
      path: 'src/a.ts',
      line: 10,
      column: 2,
      name: 'Button',
    });
    expect((component as any).resolveActiveChatContext()).toEqual({
      file: 'src/a.ts',
      line: 10,
      column: 2,
      name: 'Button',
    });

    const OriginalFileReader = (globalThis as any).FileReader;
    class SuccessFileReader {
      result = 'data:image/png;base64,ok';
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    (globalThis as any).FileReader = SuccessFileReader as any;
    await expect((component as any).readFileAsDataUrl(new File(['x'], 'a.png', { type: 'image/png' }))).resolves.toBe(
      'data:image/png;base64,ok',
    );

    class EmptyResultFileReader {
      result = null;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      readAsDataURL() {
        this.onload?.();
      }
    }
    (globalThis as any).FileReader = EmptyResultFileReader as any;
    await expect((component as any).readFileAsDataUrl(new File(['x'], 'empty.png', { type: 'image/png' }))).resolves.toBe('');

    class ErrorFileReader {
      result = null;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      readAsDataURL() {
        this.onerror?.();
      }
    }
    (globalThis as any).FileReader = ErrorFileReader as any;
    await expect((component as any).readFileAsDataUrl(new File(['x'], 'b.png', { type: 'image/png' }))).rejects.toThrow(
      'Failed to read image',
    );
    (globalThis as any).FileReader = OriginalFileReader;
  });

  it('should cover feature callbacks, availability checks and copy fallback', () => {
    component.locate = false;
    component.copy = false;
    component.target = false;
    component.ai = false;

    expect(component.features[0].available()).toBe(false);
    expect(component.features[1].available()).toBe(false);
    expect(component.features[2].available()).toBe(false);
    expect(component.features[3].available()).toBe(false);

    const toggleAiSpy = vi.spyOn(component, 'toggleAICode').mockImplementation(() => {});
    const openAiSpy = vi.spyOn(component, 'openChatModal').mockImplementation(() => {});
    component.features[3].onChange();
    component.features[3].fn();
    expect(toggleAiSpy).toHaveBeenCalledTimes(1);
    expect(openAiSpy).toHaveBeenCalledTimes(1);

    component.element = {
      path: '/tmp/example.ts',
      line: 1,
      column: 1,
    } as any;
    const copySpy = vi.spyOn(component, 'copyToClipboard').mockImplementation(() => {});
    component.copy = false;
    component.copyCode();
    expect(copySpy).toHaveBeenCalledTimes(1);
  });

  it('should cover modal lifecycle in element mode and close actions', async () => {
    const target = document.createElement('button');
    component.targetNode = target;
    vi.spyOn(component as any, 'getSourceInfo').mockReturnValue({
      path: 'src/button.tsx',
      line: 8,
      column: 1,
      name: 'Button',
    });
    const modal = document.createElement('div');
    modal.id = 'chat-modal-floating';
    Object.defineProperty(modal, 'getBoundingClientRect', {
      value: () => ({ width: 320, height: 240 }),
    });
    vi.spyOn(component.shadowRoot as ShadowRoot, 'querySelector').mockImplementation((selector: any) => {
      if (selector === '#chat-modal-floating') return modal as any;
      return null;
    });

    component.openChatModal(false);
    await component.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.chatContext).toEqual({
      file: 'src/button.tsx',
      line: 8,
      column: 1,
      name: 'Button',
    });
    expect(mockUpdateChatModalPosition).toHaveBeenCalledWith(target, modal);

    const cleanup = vi.fn();
    (component as any).chatPositionCleanup = cleanup;
    (component as any).performCloseChatModal();
    expect(cleanup).toHaveBeenCalled();
    expect((component as any).chatPositionCleanup).toBeNull();
    expect(component.showChatModal).toBe(false);

    const closeImpl = vi.spyOn(component as any, 'performCloseChatModal').mockImplementation(() => {});
    component.chatLoading = false;
    component.turnStatus = 'idle';
    component.closeChatModal();
    expect(closeImpl).toHaveBeenCalled();

    component.showCloseConfirm = true;
    component.cancelCloseChatModal();
    expect(component.showCloseConfirm).toBe(false);

    const interruptSpy = vi.spyOn(component, 'interruptChat').mockImplementation(() => {});
    component.terminateAndCloseChatModal();
    expect(interruptSpy).toHaveBeenCalled();

    const sendSpy = vi.spyOn(component, 'sendChatMessage').mockImplementation(async () => {});
    const preventDefault = vi.fn();
    component.handleChatKeyDown({
      key: 'Enter',
      shiftKey: false,
      isComposing: false,
      preventDefault,
    } as any);
    expect(preventDefault).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should cover sendChatMessage fallback branches and error handling', async () => {
    component.ip = '127.0.0.1';
    component.port = 5678;
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatInput = 'hello';
    component.chatContext = null;

    mockSendChatToServer.mockImplementationOnce(async (_ip: any, _port: any, _message: any, _context: any, _history: any, handlers: any) => {
      handlers.onText('A');
      handlers.onText('B');
      handlers.onToolStart('t1', 'Read', 2);
      handlers.onToolInput(2, { file: 'a.ts' }, undefined);
      handlers.onToolStart('t2', 'Write', undefined);
      handlers.onToolInput(undefined, { text: 'fallback' }, undefined);
      handlers.onToolResult('t1', 'done', false);
      handlers.onToolResult('unknown', 'skip', false);
    });

    await component.sendChatMessage();
    const last = component.chatMessages[component.chatMessages.length - 1] as any;
    expect(last.role).toBe('assistant');
    expect(last.content).toBe('AB');

    component.chatInput = 'err';
    const notificationSpy = vi.spyOn(component, 'showNotification').mockImplementation(() => {});
    mockSendChatToServer.mockRejectedValueOnce(new Error('network'));
    await component.sendChatMessage();
    expect(notificationSpy).toHaveBeenCalledWith('Failed to send message', 'error');
    expect(component.chatLoading).toBe(false);

    component.chatInput = 'abort';
    const abortError = new Error('aborted');
    (abortError as any).name = 'AbortError';
    mockSendChatToServer.mockRejectedValueOnce(abortError);
    await component.sendChatMessage();
    expect(component.chatLoading).toBe(false);
  });

  it('should restore persisted ai modal state in firstUpdated', async () => {
    mockLoadAIState.mockReturnValueOnce({
      showChatModal: true,
      chatMessages: [{ role: 'assistant', content: 'persisted' }],
      chatContext: null,
      chatSessionId: 'sid-resume',
      chatTheme: 'light',
      chatModel: 'gpt-5-codex',
      availableAIModels: ['gpt-5-codex'],
      chatProvider: 'codex',
      availableAIProviders: ['codex'],
      modalPosition: { left: '12px', top: '24px' },
      turnStatus: 'running',
    });

    const another = new CodeInspectorComponent();
    another.hideConsole = true;
    another.defaultAction = 'ai';
    another.ai = true;
    const refreshSpy = vi
      .spyOn(another as any, 'refreshChatProviderAndModel')
      .mockResolvedValue(undefined);
    const persistSpy = vi.spyOn(another as any, 'persistAIState');
    const resumeSpy = vi.spyOn(another as any, 'resumeAITask').mockResolvedValue(undefined);
    document.body.appendChild(another);
    await another.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(another.internalAI).toBe(true);
    expect(another.showChatModal).toBe(true);
    expect(another.classList.contains('chat-theme-light')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(refreshSpy).toHaveBeenCalled();
    expect(persistSpy).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalled();

    if (another.parentElement) {
      document.body.removeChild(another);
    }
  });

  it('should cover input/paste/timer/drag edge branches', async () => {
    component.handleChatInput({
      target: { value: 'typed' },
    } as any);
    expect(component.chatInput).toBe('typed');

    const noImageEvent = {
      clipboardData: { items: [{ type: 'text/plain' }] },
      preventDefault: vi.fn(),
    } as any;
    await component.handleChatPaste(noImageEvent);
    expect(noImageEvent.preventDefault).not.toHaveBeenCalled();

    const notificationSpy = vi.spyOn(component, 'showNotification').mockImplementation(() => {});
    const huge = new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', {
      type: 'image/png',
    });
    const hugeImageEvent = {
      clipboardData: {
        items: [{ type: 'image/png', getAsFile: () => huge }],
      },
      preventDefault: vi.fn(),
    } as any;
    await component.handleChatPaste(hugeImageEvent);
    expect(notificationSpy).toHaveBeenCalledWith(expect.stringContaining('Image too large'), 'error');

    component.chatTheme = 'light';
    component.toggleTheme();
    expect(component.chatTheme).toBe('dark');
    expect(component.classList.contains('chat-theme-light')).toBe(false);

    const content = document.createElement('div');
    content.className = 'chat-modal-content';
    Object.defineProperty(content, 'scrollHeight', { value: 321, configurable: true });
    component.shadowRoot?.appendChild(content);
    (component as any).scrollChatToBottom();
    expect(content.scrollTop).toBe(321);

    vi.useFakeTimers();
    try {
      (component as any).startTurnTimer();
      vi.advanceTimersByTime(1200);
      expect(component.turnDuration).toBeGreaterThanOrEqual(1);
      (component as any).stopTurnTimer('done');
      expect(component.turnStatus).toBe('done');

      const modal = document.createElement('div');
      modal.id = 'chat-modal-floating';
      Object.defineProperty(modal, 'offsetLeft', { value: 0 });
      Object.defineProperty(modal, 'offsetTop', { value: 0 });
      vi.spyOn(component.shadowRoot as ShadowRoot, 'querySelector').mockImplementation((selector: any) => {
        if (selector === '#chat-modal-floating') return modal as any;
        return null;
      });

      component.handleChatDragStart({
        button: 0,
        target: document.createElement('button'),
      } as any);
      expect(component.isDragging).toBe(false);

      const cleanup = vi.fn();
      (component as any).chatPositionCleanup = cleanup;
      component.handleChatDragStart({
        button: 0,
        clientX: 1,
        clientY: 2,
        target: document.createElement('div'),
        preventDefault: vi.fn(),
      } as any);
      expect(cleanup).toHaveBeenCalled();
      expect((component as any).chatPositionCleanup).toBeNull();

      component.wasDragging = true;
      component.handleChatDragEnd();
      vi.advanceTimersByTime(110);
      expect(component.wasDragging).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should cover ai menu/drag/paste/send early-return branches', async () => {
    const detached = new CodeInspectorComponent();
    detached.availableAIProviders = ['codex'];
    detached.availableAIModels = ['gpt-5-codex'];
    detached.chatProvider = 'codex';
    detached.chatModel = 'gpt-5-codex';
    await (detached as any).refreshChatProviderAndModel('claudeCode', 'claude-3.7');
    expect(detached.chatProvider).toBe('codex');
    expect(detached.chatModel).toBe('gpt-5-codex');

    component.availableAIProviders = ['codex'];
    component.availableAIModels = ['gpt-5-codex'];
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    expect(component.chatProvider).toBe('codex');
    expect(component.chatModel).toBe('gpt-5-codex');

    component.chatProvider = 'codex';
    component.switchChatProvider('codex');
    expect(component.chatProvider).toBe('codex');

    component.availableAIProviders = ['codex'];
    component.switchChatProvider('claudeCode');
    expect(component.chatProvider).toBe('codex');

    component.chatLoading = true;
    component.showProviderMenu = false;
    component.toggleProviderMenu();
    expect(component.showProviderMenu).toBe(false);
    component.chatLoading = false;
    component.availableAIProviders = ['codex'];
    component.toggleProviderMenu();
    expect(component.showProviderMenu).toBe(false);

    component.switchChatModel('   ');
    expect(component.chatModel).toBe('gpt-5-codex');
    component.switchChatModel('gpt-5-codex');
    expect(component.chatModel).toBe('gpt-5-codex');
    component.availableAIModels = ['gpt-5-codex'];
    component.switchChatModel('gpt-5.1-codex');
    expect(component.chatModel).toBe('gpt-5-codex');

    component.chatLoading = true;
    component.showModelMenu = false;
    component.toggleModelMenu();
    expect(component.showModelMenu).toBe(false);
    component.chatLoading = false;
    component.availableAIModels = ['gpt-5-codex'];
    component.toggleModelMenu();
    expect(component.showModelMenu).toBe(false);

    const noClipboardEvent = {} as any;
    await component.handleChatPaste(noClipboardEvent);

    const readSpy = vi.spyOn(component as any, 'readFileAsDataUrl').mockResolvedValue('data:image/png;base64,a');
    const noFileEvent = {
      clipboardData: {
        items: [
          { type: 'image/png', getAsFile: () => null },
          { type: 'image/png', getAsFile: () => new File(['x'], '', { type: '' }) },
        ],
      },
      preventDefault: vi.fn(),
    } as any;
    await component.handleChatPaste(noFileEvent);
    expect(noFileEvent.preventDefault).toHaveBeenCalled();
    expect(readSpy).toHaveBeenCalledTimes(1);
    expect(component.chatPastedImages[0]?.name).toBe('pasted-image-2.png');
    expect(component.chatPastedImages[0]?.type).toBe('image/png');

    (component as any).scrollPending = true;
    (component as any).scrollChatToBottom();
    expect((component as any).scrollPending).toBe(true);

    const preventDefault = vi.fn();
    component.handleChatDragStart({
      button: 1,
      preventDefault,
      target: document.createElement('div'),
    } as any);
    expect(preventDefault).not.toHaveBeenCalled();

    vi.spyOn(component.shadowRoot as ShadowRoot, 'querySelector').mockReturnValue(null as any);
    component.handleChatDragStart({
      button: 0,
      clientX: 1,
      clientY: 1,
      preventDefault: vi.fn(),
      target: document.createElement('div'),
    } as any);
    expect(component.isDragging).toBe(false);

    component.isDragging = false;
    component.handleChatDragMove({ clientX: 1, clientY: 1 } as any);
    component.isDragging = true;
    component.handleChatDragMove({ clientX: 2, clientY: 2 } as any);
    expect(component.isDragging).toBe(true);

    const closeSpy = vi.spyOn(component, 'closeChatModal').mockImplementation(() => {});
    component.wasDragging = true;
    component.handleOverlayClick();
    expect(closeSpy).not.toHaveBeenCalled();

    component.showProviderMenu = true;
    component.showModelMenu = true;
    const switcherTarget = document.createElement('div');
    switcherTarget.className = 'chat-provider-switcher';
    const stopPropagation = vi.fn();
    component.handleChatModalClick({ target: switcherTarget, stopPropagation } as any);
    expect(stopPropagation).toHaveBeenCalled();
    expect(component.showProviderMenu).toBe(true);
    expect(component.showModelMenu).toBe(true);

    component.chatLoading = true;
    component.chatInput = 'blocked';
    await component.sendChatMessage();
    expect(mockSendChatToServer).not.toHaveBeenCalled();

    component.chatLoading = false;
    component.chatImageProcessing = false;
    component.chatInput = '   ';
    component.chatPastedImages = [];
    await component.sendChatMessage();
    expect(mockSendChatToServer).not.toHaveBeenCalled();

    component.chatMessages = [];
    component.chatInput = '';
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatPastedImages = [
      {
        id: 'img-1',
        name: 'a.png',
        type: 'image/png',
        size: 1,
        previewUrl: 'blob:a',
        dataUrl: 'data:image/png;base64,a',
      },
      {
        id: 'img-2',
        name: 'b.png',
        type: 'image/png',
        size: 1,
        previewUrl: 'blob:b',
        dataUrl: 'data:image/png;base64,b',
      },
    ] as any;
    mockSendChatToServer.mockImplementationOnce(async () => {});
    await component.sendChatMessage();
    expect(component.chatMessages[0]?.content).toContain('[Pasted 2 images]');
  });

  it('should cover openChatModal refresh short-circuit branches', () => {
    const refreshSpy = vi.spyOn(component as any, 'refreshChatProviderAndModel').mockResolvedValue(undefined);

    component.chatModel = 'gpt-5-codex';
    component.availableAIModels = [];
    component.availableAIProviders = ['codex'];
    component.chatProvider = 'codex';
    component.openChatModal(true);

    component.chatModel = 'gpt-5-codex';
    component.availableAIModels = ['gpt-5-codex'];
    component.availableAIProviders = [];
    component.chatProvider = 'codex';
    component.openChatModal(true);

    component.chatModel = 'gpt-5-codex';
    component.availableAIModels = ['gpt-5-codex'];
    component.availableAIProviders = ['codex'];
    component.chatProvider = null as any;
    component.openChatModal(true);

    expect(refreshSpy).toHaveBeenCalledTimes(3);
  });

  it('should cover send/resume stream fallback branches', async () => {
    component.ip = '127.0.0.1';
    component.port = 5678;
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatInput = 'hello';

    mockSendChatToServer.mockImplementationOnce(
      async (_ip: any, _port: any, _message: any, _context: any, _history: any, handlers: any) => {
        handlers.onText('');
        handlers.onText('A');
        handlers.onToolInput(undefined, { value: 'noop' }, undefined);
      },
    );
    await component.sendChatMessage();

    component.chatSessionId = 'sid-resume-branch';
    mockSendChatToServer.mockImplementationOnce(
      async (_ip: any, _port: any, _message: any, _context: any, _history: any, handlers: any) => {
        handlers.onText('');
        handlers.onText('B');
        handlers.onToolInput(undefined, { value: 'noop' }, undefined);
      },
    );
    await (component as any).resumeAITask();
  });

  it('should cover resumed abort handling and firstUpdated fallback defaults', async () => {
    component.ip = '127.0.0.1';
    component.port = 5678;
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatSessionId = 'sid-abort';
    const abortErr = new Error('abort');
    (abortErr as any).name = 'AbortError';
    mockSendChatToServer.mockRejectedValueOnce(abortErr);
    await (component as any).resumeAITask();

    mockLoadAIState.mockReturnValueOnce({
      showChatModal: true,
      chatMessages: [{ role: 'assistant', content: 'persisted' }],
      chatContext: null,
      chatSessionId: 'sid',
      chatTheme: 'light',
      chatModel: 'gpt-5-codex',
      modalPosition: { left: '1px', top: '2px' },
      turnStatus: 'done',
    });

    const persistedFallback = new CodeInspectorComponent();
    persistedFallback.hideConsole = true;
    document.body.appendChild(persistedFallback);
    await persistedFallback.updateComplete;
    expect(persistedFallback.availableAIModels).toEqual([]);
    expect(persistedFallback.chatProvider).toBeNull();
    expect(persistedFallback.availableAIProviders).toEqual([]);
    if (persistedFallback.parentElement) {
      document.body.removeChild(persistedFallback);
    }

    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true });
    mockLoadAIState.mockReturnValueOnce(null);
    const noMatchMedia = new CodeInspectorComponent();
    noMatchMedia.hideConsole = true;
    document.body.appendChild(noMatchMedia);
    await noMatchMedia.updateComplete;
    expect(noMatchMedia.chatTheme).toBe('light');
    if (noMatchMedia.parentElement) {
      document.body.removeChild(noMatchMedia);
    }

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: true })),
    });
    mockLoadAIState.mockReturnValueOnce(null);
    const prefersDark = new CodeInspectorComponent();
    prefersDark.hideConsole = true;
    document.body.appendChild(prefersDark);
    await prefersDark.updateComplete;
    expect(prefersDark.chatTheme).toBe('dark');
    if (prefersDark.parentElement) {
      document.body.removeChild(prefersDark);
    }
    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, configurable: true });
  });

  it('should cover sendChatMessage session/history/image and onError branches', async () => {
    component.ip = '127.0.0.1';
    component.port = 5678;
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatInput = '';
    component.chatSessionId = 'sid-exists';
    component.chatPastedImages = [
      {
        id: 'img-1',
        name: 'a.png',
        type: 'image/png',
        size: 12,
        previewUrl: 'blob:a',
        dataUrl: 'data:image/png;base64,a',
      },
    ] as any;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    mockSendChatToServer.mockImplementationOnce(
      async (_ip: any, _port: any, _message: any, _context: any, history: any, handlers: any) => {
        expect(history).toBeUndefined();
        handlers.onText('T');
        await new Promise((resolve) => setTimeout(resolve, 60));
        handlers.onError(new Error('stream'));
      },
    );

    await component.sendChatMessage();
    expect(errorSpy).toHaveBeenCalledWith('Chat error:', expect.any(Error));
    expect(component.chatMessages[0]?.images?.length).toBe(1);
    expect(component.chatLoading).toBe(false);

    errorSpy.mockRestore();
  });

  it('should resume ai task stream and handle resume errors', async () => {
    component.ip = '127.0.0.1';
    component.port = 5678;
    component.chatProvider = 'codex';
    component.chatModel = 'gpt-5-codex';
    component.chatSessionId = 'sid-resume';
    component.chatContext = null;

    mockSendChatToServer.mockImplementationOnce(async (_ip: any, _port: any, _message: any, _context: any, _history: any, handlers: any) => {
      handlers.onText('R');
      await new Promise((resolve) => setTimeout(resolve, 60));
      handlers.onText('2');
      handlers.onToolStart('t1', 'Read', 1);
      handlers.onToolInput(undefined, { file: 'by-id.ts' }, 't1');
      handlers.onToolInput(1, { file: 'a.ts' }, undefined);
      handlers.onToolStart('t2', 'Write', undefined);
      handlers.onToolInput(undefined, { text: 'fallback' }, undefined);
      handlers.onToolResult('t1', 'ok', false);
      handlers.onError(new Error('resume'));
      handlers.onSessionId?.('sid-new');
      handlers.onProjectRoot?.('/project');
      handlers.onModel?.('gpt-5.1-codex');
    });

    await (component as any).resumeAITask();
    expect(component.chatSessionId).toBe('sid-new');
    expect(component.chatModel).toBe('gpt-5.1-codex');
    expect(component.turnStatus).toBe('done');
    expect(component.chatLoading).toBe(false);

    component.chatSessionId = 'sid-resume-2';
    mockSendChatToServer.mockRejectedValueOnce(new Error('resume failed'));
    await (component as any).resumeAITask();
    expect(component.turnStatus).toBe('interrupt');

    component.chatSessionId = 'sid-resume-3';
    component.chatLoading = true;
    await (component as any).resumeAITask();
  });

  it('should trigger mode shortcuts for ai and non-ai actions', () => {
    const isTrackingSpy = vi.spyOn(component, 'isTracking').mockReturnValue(true as any);
    const openAiSpy = vi.spyOn(component, 'openChatModal').mockImplementation(() => {});
    const dispatchSpy = vi.spyOn(component, 'dispatchCustomEvent').mockImplementation(() => {});
    const featureFn = vi.fn();

    component.targetNode = document.createElement('div');
    component.element = {
      path: '/tmp/a.ts',
      line: 1,
      column: 1,
    } as any;
    (component as any).features = [
      {
        key: 4,
        action: 'ai',
        checked: () => false,
        available: () => true,
        fn: vi.fn(),
      },
      {
        key: 1,
        action: 'locate',
        checked: () => false,
        available: () => true,
        fn: featureFn,
      },
    ];

    const preventDefaultAi = vi.fn();
    const stopPropagationAi = vi.fn();
    (component as any).handleModeShortcut({
      code: 'Digit4',
      key: '4',
      keyCode: 52,
      preventDefault: preventDefaultAi,
      stopPropagation: stopPropagationAi,
    });
    expect(openAiSpy).toHaveBeenCalledWith(true);
    expect(preventDefaultAi).toHaveBeenCalled();
    expect(stopPropagationAi).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith('ai');

    const preventDefaultLocate = vi.fn();
    const stopPropagationLocate = vi.fn();
    (component as any).handleModeShortcut({
      code: 'Digit1',
      key: '1',
      keyCode: 49,
      preventDefault: preventDefaultLocate,
      stopPropagation: stopPropagationLocate,
    });
    expect(featureFn).toHaveBeenCalled();
    expect(preventDefaultLocate).toHaveBeenCalled();
    expect(stopPropagationLocate).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith('locate');

    isTrackingSpy.mockRestore();
  });

  it('should cover firstUpdated defaultAction and fallback activation branches', async () => {
    const created: CodeInspectorComponent[] = [];
    const mount = async (props: Partial<CodeInspectorComponent>) => {
      const ins = new CodeInspectorComponent();
      ins.hideConsole = true;
      Object.assign(ins, props);
      document.body.appendChild(ins);
      await ins.updateComplete;
      created.push(ins);
      return ins;
    };

    const targetAction = await mount({ defaultAction: 'target', target: true, locate: false, copy: false, ai: false });
    expect(targetAction.internalTarget).toBe(true);

    const locateAction = await mount({ defaultAction: 'locate', locate: true, copy: false, target: false, ai: false });
    expect(locateAction.internalLocate).toBe(true);

    const fallbackCopy = await mount({ defaultAction: undefined as any, locate: false, copy: true, target: false, ai: false });
    expect(fallbackCopy.internalCopy).toBe(true);

    const fallbackTarget = await mount({ defaultAction: undefined as any, locate: false, copy: false, target: true, ai: false });
    expect(fallbackTarget.internalTarget).toBe(true);

    const fallbackAi = await mount({ defaultAction: undefined as any, locate: false, copy: false, target: false, ai: true });
    expect(fallbackAi.internalAI).toBe(true);

    for (const ins of created) {
      if (ins.parentElement) {
        document.body.removeChild(ins);
      }
    }
  });
});
