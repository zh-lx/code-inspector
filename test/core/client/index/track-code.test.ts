// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('trackCode', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);

    // Set up element info for tests
    component.element = {
      name: 'div',
      path: '/path/to/file.ts',
      line: 10,
      column: 5
    };
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Locate Feature', () => {
    it('should call sendXHR when internalLocate is true and sendType is xhr', () => {
      component.internalLocate = true;
      component.sendType = 'xhr';
      const sendXHRSpy = vi.spyOn(component, 'sendXHR').mockImplementation(() => {});

      component.trackCode();

      expect(sendXHRSpy).toHaveBeenCalled();
    });

    it('should call sendImg when internalLocate is true and sendType is img', () => {
      component.internalLocate = true;
      component.sendType = 'img';
      const sendImgSpy = vi.spyOn(component, 'sendImg').mockImplementation(() => {});

      component.trackCode();

      expect(sendImgSpy).toHaveBeenCalled();
    });

    it('should not call send methods when internalLocate is false', () => {
      component.internalLocate = false;
      const sendXHRSpy = vi.spyOn(component, 'sendXHR').mockImplementation(() => {});
      const sendImgSpy = vi.spyOn(component, 'sendImg').mockImplementation(() => {});

      component.trackCode();

      expect(sendXHRSpy).not.toHaveBeenCalled();
      expect(sendImgSpy).not.toHaveBeenCalled();
    });
  });

  describe('Copy Feature', () => {
    it('should call copyToClipboard when internalCopy is true', () => {
      component.internalCopy = true;
      component.copy = true;
      const copyToClipboardSpy = vi.spyOn(component, 'copyToClipboard').mockImplementation(() => {});

      component.trackCode();

      expect(copyToClipboardSpy).toHaveBeenCalled();
    });

    it('should not call copyToClipboard when internalCopy is false', () => {
      component.internalCopy = false;
      const copyToClipboardSpy = vi.spyOn(component, 'copyToClipboard').mockImplementation(() => {});

      component.trackCode();

      expect(copyToClipboardSpy).not.toHaveBeenCalled();
    });
  });

  describe('Target Feature', () => {
    it('should open target URL when internalTarget is true', () => {
      component.internalTarget = true;
      component.target = 'https://example.com/{file}';
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component.trackCode();

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://example.com//path/to/file.ts',
        '_blank'
      );
    });

    it('should not open window when internalTarget is false', () => {
      component.internalTarget = false;
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      component.trackCode();

      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('Custom Event', () => {
    it('should dispatch code-inspector:trackCode custom event', () => {
      const eventHandler = vi.fn();
      window.addEventListener('code-inspector:trackCode', eventHandler);

      component.trackCode();

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('code-inspector:trackCode');
      expect(event.detail).toEqual(component.element);

      window.removeEventListener('code-inspector:trackCode', eventHandler);
    });

    it('should include element info in custom event detail', () => {
      component.element = {
        name: 'span',
        path: '/custom/path.tsx',
        line: 42,
        column: 15
      };

      const eventHandler = vi.fn();
      window.addEventListener('code-inspector:trackCode', eventHandler);

      component.trackCode();

      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.name).toBe('span');
      expect(event.detail.path).toBe('/custom/path.tsx');
      expect(event.detail.line).toBe(42);
      expect(event.detail.column).toBe(15);

      window.removeEventListener('code-inspector:trackCode', eventHandler);
    });
  });

  describe('Multiple Features', () => {
    it('should handle all features enabled', () => {
      component.internalLocate = true;
      component.internalCopy = true;
      component.internalTarget = true;
      component.sendType = 'xhr';
      component.target = 'https://example.com/{file}';
      component.copy = true;

      const sendXHRSpy = vi.spyOn(component, 'sendXHR').mockImplementation(() => {});
      const copyToClipboardSpy = vi.spyOn(component, 'copyToClipboard').mockImplementation(() => {});
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const eventHandler = vi.fn();
      window.addEventListener('code-inspector:trackCode', eventHandler);

      component.trackCode();

      expect(sendXHRSpy).toHaveBeenCalled();
      expect(copyToClipboardSpy).toHaveBeenCalled();
      expect(windowOpenSpy).toHaveBeenCalled();
      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener('code-inspector:trackCode', eventHandler);
    });

    it('should handle all features disabled except custom event', () => {
      component.internalLocate = false;
      component.internalCopy = false;
      component.internalTarget = false;

      const sendXHRSpy = vi.spyOn(component, 'sendXHR').mockImplementation(() => {});
      const sendImgSpy = vi.spyOn(component, 'sendImg').mockImplementation(() => {});
      const copyToClipboardSpy = vi.spyOn(component, 'copyToClipboard').mockImplementation(() => {});
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      const eventHandler = vi.fn();
      window.addEventListener('code-inspector:trackCode', eventHandler);

      component.trackCode();

      expect(sendXHRSpy).not.toHaveBeenCalled();
      expect(sendImgSpy).not.toHaveBeenCalled();
      expect(copyToClipboardSpy).not.toHaveBeenCalled();
      expect(windowOpenSpy).not.toHaveBeenCalled();
      // Custom event should still be dispatched
      expect(eventHandler).toHaveBeenCalled();

      window.removeEventListener('code-inspector:trackCode', eventHandler);
    });
  });
});
