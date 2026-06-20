import { beforeAll, describe, expect, it, vi } from 'vitest';

let AITerminalManagerCtor: typeof import('@/core/src/client/ai-terminal').AITerminalManager;

beforeAll(async () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });

  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );

  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => ({
      fillStyle: '#000000',
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      })),
    })),
  });

  const terminalModule = await import('@/core/src/client/ai-terminal');
  AITerminalManagerCtor = terminalModule.AITerminalManager;
});

function renderTerminalOutput(
  data: string,
  theme: 'dark' | 'light',
  provider: 'claudeCode' | 'codex' | 'opencode' = 'codex',
): string {
  const manager = new AITerminalManagerCtor('127.0.0.1', 5173) as any;
  const write = vi.fn();

  manager.terminal = {
    options: {},
    reset: vi.fn(),
    write,
  };
  manager.currentTheme = theme;
  manager.currentProvider = provider;
  manager.write(data);

  const lastCall = write.mock.calls[write.mock.calls.length - 1];
  return lastCall?.[0] || '';
}

describe('client ai terminal output colors', () => {
  it('should remap dark truecolor backgrounds in light terminal output', () => {
    const input = '\x1b[48;2;41;41;41mUse /skills\x1b[0m';
    const output = renderTerminalOutput(input, 'light');

    expect(output).toContain('\x1b[48;2;236;239;244m');
    expect(output).not.toContain('48;2;41;41;41');
    expect(renderTerminalOutput(input, 'dark')).toBe(input);
  });

  it('should remap dark ANSI background color indexes in light terminal output', () => {
    expect(
      renderTerminalOutput(
        '\x1b[40mblack bg\x1b[0m',
        'light',
      ),
    ).toContain('\x1b[48;2;236;239;244m');

    expect(
      renderTerminalOutput(
        '\x1b[48;5;236mindexed bg\x1b[0m',
        'light',
      ),
    ).toContain('\x1b[48;2;236;239;244m');
  });

  it('should remap low-contrast light foregrounds in light terminal output', () => {
    expect(
      renderTerminalOutput(
        '\x1b[38;2;245;245;245mwhite text\x1b[0m',
        'light',
      ),
    ).toContain('\x1b[38;2;46;52;64m');

    expect(
      renderTerminalOutput(
        '\x1b[37mwhite ansi text\x1b[0m',
        'light',
      ),
    ).toContain('\x1b[38;2;46;52;64m');
  });

  it('should preserve opencode terminal output without theme normalization', () => {
    expect(
      renderTerminalOutput('\x1b]12;#ffffff\x07prompt', 'light', 'opencode'),
    ).toBe('\x1b]12;#ffffff\x07prompt');

    expect(
      renderTerminalOutput(
        '\x1b[48;2;41;41;41mUse /skills\x1b[0m',
        'light',
        'opencode',
      ),
    ).toBe('\x1b[48;2;41;41;41mUse /skills\x1b[0m');
  });

  it('should remap low-contrast light backgrounds and dark foregrounds in dark terminal output', () => {
    expect(
      renderTerminalOutput(
        '\x1b[48;2;236;239;244mlight bg\x1b[0m',
        'dark',
      ),
    ).toContain('\x1b[48;2;46;52;64m');

    expect(
      renderTerminalOutput(
        '\x1b[38;2;30;30;30mdark text\x1b[0m',
        'dark',
      ),
    ).toContain('\x1b[38;2;216;222;233m');
  });

  it('should replay buffered output when the terminal theme changes', () => {
    const manager = new AITerminalManagerCtor('127.0.0.1', 5173) as any;
    const terminal = {
      options: {},
      reset: vi.fn(),
      write: vi.fn(),
    };
    const input = '\x1b[48;2;41;41;41mUse /skills\x1b[0m';

    manager.terminal = terminal;
    manager.currentTheme = 'light';
    manager.currentProvider = 'codex';
    manager.write(input);

    expect(terminal.write).toHaveBeenLastCalledWith(
      expect.stringContaining('\x1b[48;2;236;239;244m'),
    );

    manager.setTheme('dark');

    expect(terminal.reset).toHaveBeenCalledOnce();
    expect(terminal.write).toHaveBeenLastCalledWith(input);
  });

  it('should replay raw buffered output for opencode theme changes', () => {
    const manager = new AITerminalManagerCtor('127.0.0.1', 5173) as any;
    const terminal = {
      options: {},
      reset: vi.fn(),
      write: vi.fn(),
    };
    const input = '\x1b[48;2;41;41;41mUse /skills\x1b[0m';

    manager.terminal = terminal;
    manager.currentTheme = 'light';
    manager.currentProvider = 'opencode';
    manager.write(input);

    expect(terminal.write).toHaveBeenLastCalledWith(input);

    manager.setTheme('dark');

    expect(terminal.reset).toHaveBeenCalledOnce();
    expect(terminal.write).toHaveBeenLastCalledWith(input);
  });

  it('should remove scrollbar gutter for opencode layout', () => {
    const manager = new AITerminalManagerCtor('127.0.0.1', 5173) as any;
    const container = document.createElement('div');

    manager.container = container;
    manager.currentProvider = 'opencode';
    manager.fitAddon = {};
    manager.fit = vi.fn();
    manager.terminal = { options: {} };

    manager['applyProviderLayout']();

    expect(container.dataset.terminalProvider).toBe('opencode');
    expect(manager.terminal.options.overviewRuler).toEqual({ width: 0 });
    expect(manager.fit).toHaveBeenCalledOnce();
  });

  it('should compute wider dimensions for opencode with zero gutter', () => {
    const manager = new AITerminalManagerCtor('127.0.0.1', 5173) as any;
    const host = document.createElement('div');
    const terminalElement = document.createElement('div');

    Object.defineProperty(host, 'parentElement', {
      configurable: true,
      value: null,
    });
    Object.defineProperty(terminalElement, 'parentElement', {
      configurable: true,
      value: host,
    });

    manager.container = document.createElement('div');
    manager.terminal = {
      element: terminalElement,
      options: { scrollback: 5000 },
      _core: {
        _renderService: {
          dimensions: {
            css: {
              cell: { width: 10, height: 20 },
            },
          },
        },
      },
    };

    const computedStyleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((el: Element) => {
        if (el === host) {
          return {
            getPropertyValue: (prop: string) =>
              prop === 'width' ? '470px' : prop === 'height' ? '200px' : '0px',
          } as CSSStyleDeclaration;
        }
        return {
          getPropertyValue: () => '0px',
        } as CSSStyleDeclaration;
      });

    manager.currentProvider = 'codex';
    expect(manager['proposeDimensions']()).toEqual({ cols: 46, rows: 10 });

    manager.currentProvider = 'opencode';
    expect(manager['proposeDimensions']()).toEqual({ cols: 47, rows: 10 });

    computedStyleSpy.mockRestore();
  });

  it('should initialize opencode terminals with zero overview ruler width', () => {
    const container = document.createElement('div');
    const manager = new AITerminalManagerCtor('127.0.0.1', 5173);
    document.body.appendChild(container);

    manager.mount(container, 'dark', 'opencode');

    expect((manager as any).currentProvider).toBe('opencode');
    expect((manager as any).terminal.options.overviewRuler).toEqual({ width: 0 });
    expect(container.dataset.terminalProvider).toBe('opencode');

    manager.dispose();
    container.remove();
  });

});

