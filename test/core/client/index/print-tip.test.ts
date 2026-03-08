import { CodeInspectorComponent } from '@/core/src/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('printTip', () => {
  let consoleSpy: any;
  let component: CodeInspectorComponent;
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // 创建组件实例
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    consoleSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    // 清理
    document.body.removeChild(component);
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true
    });
    consoleSpy.mockRestore();
  });


  it('should print Windows hotkeys correctly', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });

    component.hotKeys = 'shiftKey,altKey';
    component.printTip();

    expect(consoleSpy).toHaveBeenCalled();
    const messages = consoleSpy.mock.calls.map((call) => String(call[0] || ''));
    expect(messages.some((msg) => msg.includes('[code-inspector-plugin]'))).toBe(true);
    expect(messages.some((msg) => msg.toLowerCase().includes('left click'))).toBe(true);
  });

  it('should handle single hotkey', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });
    component.hotKeys = 'shiftKey';
    component.printTip();

    expect(consoleSpy).toHaveBeenCalled();
    const messages = consoleSpy.mock.calls.map((call) => String(call[0] || ''));
    expect(messages.some((msg) => msg.includes('[code-inspector-plugin]'))).toBe(true);
  });

  it('should print Mac hotkeys correctly', () => {
    // 模拟 MacOS 环境
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      configurable: true,
    });
    component.hotKeys = 'shiftKey,altKey';
    component.printTip();

    expect(consoleSpy).toHaveBeenCalled();
    const messages = consoleSpy.mock.calls.map((call) => String(call[0] || ''));
    expect(messages.some((msg) => msg.includes('[code-inspector-plugin]'))).toBe(true);
    expect(messages.some((msg) => msg.toLowerCase().includes('left click'))).toBe(true);
  });

  it('should still print guide when no features are active', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });

    component.hotKeys = 'shiftKey,altKey';
    // Disable all features
    component.internalLocate = false;
    component.internalCopy = false;
    component.internalTarget = false;

    component.printTip();

    expect(consoleSpy).toHaveBeenCalled();
    const messages = consoleSpy.mock.calls.map((call) => String(call[0] || ''));
    expect(messages.some((msg) => msg.includes('[code-inspector-plugin]'))).toBe(true);
  });

});
