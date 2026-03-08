import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockComputePosition = vi.hoisted(() => vi.fn());

vi.mock('@floating-ui/dom', () => ({
  computePosition: mockComputePosition,
  flip: vi.fn(() => ({ name: 'flip' })),
  shift: vi.fn(() => ({ name: 'shift' })),
  offset: vi.fn(() => ({ name: 'offset' })),
}));

import {
  fetchModelInfo,
  renderChatModal,
  sendChatToServer,
  setProjectRoot,
  updateChatModalPosition,
} from '@/core/src/client/ai';

function createHandlers() {
  return {
    closeChatModal: vi.fn(),
    confirmCloseChatModal: vi.fn(),
    cancelCloseChatModal: vi.fn(),
    terminateAndCloseChatModal: vi.fn(),
    clearChatMessages: vi.fn(),
    handleChatInput: vi.fn(),
    handleChatKeyDown: vi.fn(),
    handleChatPaste: vi.fn(),
    removePastedImage: vi.fn(),
    sendChatMessage: vi.fn(),
    toggleTheme: vi.fn(),
    interruptChat: vi.fn(),
    toggleModelMenu: vi.fn(),
    switchModel: vi.fn(),
    toggleProviderMenu: vi.fn(),
    switchProvider: vi.fn(),
    handleDragStart: vi.fn(),
    handleDragMove: vi.fn(),
    handleDragEnd: vi.fn(),
    handleModalClick: vi.fn(),
    handleOverlayClick: vi.fn(),
  };
}

function collectTemplateText(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map((item) => collectTemplateText(item)).join('');

  if (typeof node === 'object') {
    const strings = (node as any).strings;
    const values = (node as any).values;
    if (Array.isArray(strings) && Array.isArray(values)) {
      return (
        strings.join('') + values.map((item: unknown) => collectTemplateText(item)).join('')
      );
    }
  }

  return '';
}

describe('client ai module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setProjectRoot('/project');
    mockComputePosition.mockResolvedValue({ x: 100, y: 120 });
  });

  it('should return null when updateChatModalPosition receives null elements', () => {
    expect(updateChatModalPosition(null, null)).toBeNull();
  });

  it('should place floating element using computePosition result', async () => {
    const ref = document.createElement('div');
    const floating = document.createElement('div');

    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1200,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    vi.spyOn(ref, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      right: 110,
      bottom: 220,
      width: 100,
      height: 200,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as any);

    vi.spyOn(floating, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 300,
      bottom: 400,
      width: 300,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as any);

    updateChatModalPosition(ref, floating);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(floating.style.left).toMatch(/px$/);
    expect(floating.style.top).toMatch(/px$/);
    expect(floating.classList.contains('chat-modal-centered')).toBe(false);
  });

  it('should center floating element when computed position overflows viewport', async () => {
    const ref = document.createElement('div');
    const floating = document.createElement('div');

    mockComputePosition.mockResolvedValueOnce({ x: -999, y: -999 });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 400,
      configurable: true,
    });

    vi.spyOn(ref, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 200,
      bottom: 200,
      width: 100,
      height: 100,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    } as any);

    vi.spyOn(floating, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 280,
      bottom: 180,
      width: 280,
      height: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as any);

    updateChatModalPosition(ref, floating);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(floating.classList.contains('chat-modal-centered')).toBe(true);
    expect(floating.style.left).toMatch(/px$/);
    expect(floating.style.top).toMatch(/px$/);
  });

  it('should evaluate overlap checks against very large reference bounds', async () => {
    const ref = document.createElement('div');
    const floating = document.createElement('div');

    mockComputePosition.mockResolvedValueOnce({ x: 100, y: 100 });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1200,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    vi.spyOn(ref, 'getBoundingClientRect').mockReturnValue({
      left: -1000000,
      top: -1000000,
      right: 1000000,
      bottom: 1000000,
      width: 2000000,
      height: 2000000,
      x: -1000000,
      y: -1000000,
      toJSON: () => ({}),
    } as any);

    vi.spyOn(floating, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 150,
      bottom: 150,
      width: 150,
      height: 150,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as any);

    updateChatModalPosition(ref, floating);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(floating.classList.contains('chat-modal-centered')).toBe(true);
  });

  it('should evaluate all overlap conjunction checks when positioned inside reference bounds', async () => {
    const ref = document.createElement('div');
    const floating = document.createElement('div');

    mockComputePosition.mockResolvedValueOnce({ x: 120, y: 130 });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1600,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 900,
      configurable: true,
    });

    vi.spyOn(ref, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 500,
      bottom: 500,
      width: 400,
      height: 400,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    } as any);

    vi.spyOn(floating, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as any);

    updateChatModalPosition(ref, floating);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(floating.style.left).toMatch(/px$/);
    expect(floating.style.top).toMatch(/px$/);
  });

  it('should cover overlap short-circuit branches for each conjunction stage', async () => {
    const makeRef = (rect: any) => {
      const el = document.createElement('div');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        width: 100,
        height: 100,
        x: rect.left,
        y: rect.top,
        toJSON: () => ({}),
        ...rect,
      } as any);
      return el;
    };
    const makeFloating = (width: number, height: number) => {
      const el = document.createElement('div');
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: width,
        bottom: height,
        width,
        height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as any);
      return el;
    };

    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 3000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 2000,
      configurable: true,
    });

    // Stage 1 short-circuit: x < right is false.
    mockComputePosition.mockResolvedValueOnce({ x: 600, y: 100 });
    updateChatModalPosition(
      makeRef({ left: 100, top: 100, right: 500, bottom: 500 }),
      makeFloating(100, 100),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Stage 2 short-circuit: x + width > left is false while first check is true.
    mockComputePosition.mockResolvedValueOnce({ x: 50, y: 100 });
    updateChatModalPosition(
      makeRef({ left: 100, top: 100, right: 500, bottom: 500 }),
      makeFloating(40, 100),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Stage 3 short-circuit: y < bottom is false while first two checks are true.
    mockComputePosition.mockResolvedValueOnce({ x: 150, y: 600 });
    updateChatModalPosition(
      makeRef({ left: 100, top: 100, right: 500, bottom: 500 }),
      makeFloating(200, 100),
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('should render empty template when chat modal is hidden', () => {
    const tpl = renderChatModal({ showChatModal: false } as any, createHandlers() as any);
    expect(Array.isArray((tpl as any).strings)).toBe(true);
    expect((tpl as any).strings.join('')).toBe('');
  });

  it('should render rich modal content with providers/models/messages', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: true,
      chatImageProcessing: false,
      availableProviders: ['codex', 'claudeCode'],
      chatProvider: 'codex',
      showProviderMenu: true,
      availableModels: ['gpt-5-codex', 'gpt-5.1-codex'],
      chatModel: 'gpt-5-codex',
      showModelMenu: true,
      chatContext: { name: 'Button', file: 'src/button.tsx', line: 10, column: 1 },
      chatTheme: 'dark',
      chatLoading: false,
      turnStatus: 'idle',
      turnDuration: 0,
      inputMessage: 'hello',
      chatInput: 'hello',
      chatPastedImages: [],
      currentTools: new Map(),
      selectedImages: [
        { id: '1', name: 'a.png', previewUrl: 'data:image/png;base64,aGVsbG8=' },
      ],
      chatMessages: [
        {
          role: 'user',
          content: 'question',
          context: { name: 'Button', file: '/project/src/button.tsx', line: 10, column: 1 },
          images: [{ id: '1', name: 'a.png', previewUrl: 'data:image/png;base64,aGVsbG8=' }],
        },
        {
          role: 'assistant',
          content: '',
          blocks: [
            { type: 'text', content: 'answer' },
            {
              type: 'tool',
              tool: {
                toolId: 't1',
                name: 'Edit',
                isComplete: true,
                input: { old_string: 'a', new_string: 'b' },
                result: 'ok',
              },
            },
          ],
        },
      ],
    };

    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = (tpl as any).strings.join('');
    expect(raw).toContain('AI Assistant');
    expect(raw).toContain('chat-modal-overlay');
    expect(raw).toContain('chat-input');
  });

  it('should render single provider/model badges, loading footer and close confirm', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: true,
      isDragging: false,
      chatImageProcessing: true,
      availableProviders: ['codex'],
      chatProvider: 'codex',
      showProviderMenu: false,
      availableModels: ['gpt-5-codex'],
      chatModel: 'gpt-5-codex',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'light',
      chatLoading: true,
      turnStatus: 'running',
      turnDuration: 61,
      inputMessage: '',
      chatInput: '',
      currentTools: new Map(),
      chatPastedImages: [{ id: '1', name: 'a.png', previewUrl: 'data:image/png;base64,a' }],
      chatMessages: [],
    };

    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).toContain('chat-interrupt-btn');
    expect(raw).toContain('chat-close-confirm-overlay');
    expect(raw).toContain('chat-provider-badge');
    expect(raw).toContain('chat-model-badge');
    expect(raw).toContain('Codex');
    expect(raw).toContain('gpt-5-codex');
  });

  it('should render multi provider/model fallback labels and closed menus', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: false,
      chatImageProcessing: false,
      availableProviders: ['codex', 'claudeCode'],
      chatProvider: null,
      showProviderMenu: false,
      availableModels: ['gpt-5-codex', 'gpt-5.1-codex'],
      chatModel: '',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'dark',
      chatLoading: false,
      turnStatus: 'idle',
      turnDuration: 0,
      inputMessage: '',
      chatInput: 'hello',
      currentTools: new Map(),
      chatPastedImages: [],
      chatMessages: [],
    };
    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).toContain('Codex');
    expect(raw).toContain('gpt-5-codex');
  });

  it('should omit single provider/model badge when selected values are empty', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: false,
      chatImageProcessing: false,
      availableProviders: ['codex'],
      chatProvider: null,
      showProviderMenu: false,
      availableModels: ['gpt-5-codex'],
      chatModel: '',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'dark',
      chatLoading: false,
      turnStatus: 'idle',
      turnDuration: 0,
      inputMessage: '',
      chatInput: '',
      currentTools: new Map(),
      chatPastedImages: [],
      chatMessages: [],
    };
    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).not.toContain('chat-provider-badge');
    expect(raw).not.toContain('chat-model-badge');
  });

  it('should render done status text when turn is completed', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: false,
      chatImageProcessing: false,
      availableProviders: ['codex'],
      chatProvider: 'codex',
      showProviderMenu: false,
      availableModels: ['gpt-5-codex'],
      chatModel: 'gpt-5-codex',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'dark',
      chatLoading: false,
      turnStatus: 'done',
      turnDuration: 5,
      inputMessage: '',
      chatInput: 'ok',
      currentTools: new Map(),
      chatPastedImages: [],
      chatMessages: [{ role: 'assistant', content: 'done' }],
    };

    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).toContain('chat-status-text');
    expect(raw).toContain('Done');
  });

  it('should render interrupt status text when turn status is neither running nor done', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: false,
      chatImageProcessing: false,
      availableProviders: ['codex'],
      chatProvider: 'codex',
      showProviderMenu: false,
      availableModels: ['gpt-5-codex'],
      chatModel: 'gpt-5-codex',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'dark',
      chatLoading: false,
      turnStatus: 'interrupt',
      turnDuration: 1,
      inputMessage: '',
      chatInput: '',
      currentTools: new Map(),
      chatPastedImages: [],
      chatMessages: [],
    };
    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).toContain('Interrupt');
  });

  it('should render pasted image fallback alt text and disable controls from image processing', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: false,
      chatImageProcessing: true,
      availableProviders: ['codex'],
      chatProvider: 'codex',
      showProviderMenu: false,
      availableModels: ['gpt-5-codex'],
      chatModel: 'gpt-5-codex',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'dark',
      chatLoading: false,
      turnStatus: 'idle',
      turnDuration: 0,
      inputMessage: '',
      chatInput: '  ',
      currentTools: new Map(),
      chatPastedImages: [{ id: 'img-1', name: '', previewUrl: 'data:image/png;base64,a' }],
      chatMessages: [],
    };
    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).toContain('pasted-image');
  });

  it('should render loading cursor when the latest message is from user', () => {
    const state: any = {
      showChatModal: true,
      showCloseConfirm: false,
      isDragging: false,
      chatImageProcessing: false,
      availableProviders: ['codex'],
      chatProvider: 'codex',
      showProviderMenu: false,
      availableModels: ['gpt-5-codex'],
      chatModel: 'gpt-5-codex',
      showModelMenu: false,
      chatContext: null,
      chatTheme: 'dark',
      chatLoading: true,
      turnStatus: 'idle',
      turnDuration: 0,
      inputMessage: '',
      chatInput: '',
      currentTools: new Map(),
      chatPastedImages: [],
      chatMessages: [{ role: 'user', content: 'pending' }],
    };

    const tpl = renderChatModal(state, createHandlers() as any);
    const raw = collectTemplateText(tpl);
    expect(raw).toContain('chat-loading');
  });

  it('should fetch model info with normalized providers/models', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        model: 'gpt-5-codex',
        models: ['gpt-5-codex', '', 'gpt-5.1-codex'],
        provider: 'codex',
        providers: ['codex', 'invalid', 'claudeCode'],
      }),
    })));

    const info = await fetchModelInfo('127.0.0.1', 5678, 'codex');
    expect(info).toEqual({
      model: 'gpt-5-codex',
      models: ['gpt-5-codex', 'gpt-5.1-codex'],
      provider: 'codex',
      providers: ['codex', 'claudeCode'],
    });
  });

  it('should fallback model/providers shape when payload contains non-array fields', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        model: 'claude-sonnet-4-5',
        models: null,
        provider: 'claudeCode',
        providers: null,
      }),
    })));

    const info = await fetchModelInfo('127.0.0.1', 5678, 'claudeCode');
    expect(info).toEqual({
      model: 'claude-sonnet-4-5',
      models: ['claude-sonnet-4-5'],
      provider: 'claudeCode',
      providers: ['claudeCode'],
    });
  });

  it('should fallback when model info request is not ok or throws', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await fetchModelInfo('127.0.0.1', 5678, 'claudeCode')).toEqual({
      model: '',
      models: [],
      provider: 'claudeCode',
      providers: ['claudeCode'],
    });
    expect(await fetchModelInfo('127.0.0.1', 5678)).toEqual({
      model: '',
      models: [],
      provider: null,
      providers: [],
    });

    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network');
    }));
    expect(await fetchModelInfo('127.0.0.1', 5678)).toEqual({
      model: '',
      models: [],
      provider: null,
      providers: [],
    });
    expect(await fetchModelInfo('127.0.0.1', 5678, 'codex')).toEqual({
      model: '',
      models: [],
      provider: 'codex',
      providers: ['codex'],
    });
  });

  it('should return empty normalized models when both model and models are missing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        model: null,
        models: null,
        provider: null,
        providers: [],
      }),
    })));

    expect(await fetchModelInfo('127.0.0.1', 5678)).toEqual({
      model: '',
      models: [],
      provider: null,
      providers: [],
    });
  });

  it('should parse SSE stream events in sendChatToServer', async () => {
    const chunks = [
      'data: {"type":"text","content":"A"}\n',
      'data: {"type":"tool_start","toolId":"t1","toolName":"Read","index":1}\n',
      'data: {"type":"tool_input","index":1,"input":{"file":"a"},"toolUseId":"t1"}\n',
      'data: {"type":"tool_result","toolUseId":"t1","content":"done","isError":false}\n',
      'data: {"type":"session","sessionId":"sid-1"}\n',
      'data: {"type":"info","cwd":"/project","model":"gpt-5-codex"}\n',
      'data: {"type":"legacy","content":"L"}\n',
      'data: {"error":"boom"}\n',
      'data: [DONE]\n',
      'data: {bad-json}\n',
      '\n',
    ];

    const reader = {
      index: 0,
      read: vi.fn(async function () {
        if (this.index >= chunks.length) return { done: true, value: undefined };
        const value = new TextEncoder().encode(chunks[this.index++]);
        return { done: false, value };
      }),
    } as any;

    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      body: {
        getReader: () => reader,
      },
    })));

    const handlers = {
      onText: vi.fn(),
      onToolStart: vi.fn(),
      onToolInput: vi.fn(),
      onToolResult: vi.fn(),
      onError: vi.fn(),
      onSessionId: vi.fn(),
      onProjectRoot: vi.fn(),
      onModel: vi.fn(),
    };

    await sendChatToServer(
      '127.0.0.1',
      5678,
      'hello',
      null,
      [{ role: 'assistant', content: 'h' }],
      handlers,
      undefined,
      'sid-0',
      'codex',
      'gpt-5-codex',
    );

    expect(handlers.onText).toHaveBeenCalledWith('A');
    expect(handlers.onToolStart).toHaveBeenCalledWith('t1', 'Read', 1);
    expect(handlers.onToolInput).toHaveBeenCalledWith(1, { file: 'a' }, 't1');
    expect(handlers.onToolResult).toHaveBeenCalledWith('t1', 'done', false);
    expect(handlers.onSessionId).toHaveBeenCalledWith('sid-1');
    expect(handlers.onProjectRoot).toHaveBeenCalledWith('/project');
    expect(handlers.onModel).toHaveBeenCalledWith('gpt-5-codex');
    expect(handlers.onText).toHaveBeenCalledWith('L');
    expect(handlers.onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should throw when chat request is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));

    await expect(
      sendChatToServer('127.0.0.1', 5678, 'hello', null, undefined, {
        onText: vi.fn(),
        onToolStart: vi.fn(),
        onToolInput: vi.fn(),
        onToolResult: vi.fn(),
        onError: vi.fn(),
      } as any),
    ).rejects.toThrow('Chat request failed');
  });
});
