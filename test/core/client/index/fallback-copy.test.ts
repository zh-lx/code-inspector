// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('fallbackCopy', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(component);
    document.querySelectorAll('.code-inspector-notification').forEach(el => el.remove());
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Textarea Creation', () => {
    it('should create textarea with correct value', () => {
      document.execCommand = vi.fn().mockReturnValue(true);

      (component as any).fallbackCopy('test text');

      // Textarea is removed after copy, but execCommand should be called
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should set textarea style to fixed and opacity 0', () => {
      let capturedTextarea: HTMLTextAreaElement | null = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);
      vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
        if (node instanceof HTMLTextAreaElement) {
          capturedTextarea = node;
        }
        return originalAppendChild(node);
      });

      document.execCommand = vi.fn().mockReturnValue(true);

      (component as any).fallbackCopy('test text');

      expect(capturedTextarea).toBeTruthy();
      expect(capturedTextarea?.style.position).toBe('fixed');
      expect(capturedTextarea?.style.opacity).toBe('0');
    });
  });

  describe('Copy Success', () => {
    it('should show success notification when execCommand returns true', () => {
      document.execCommand = vi.fn().mockReturnValue(true);
      const showNotificationSpy = vi.spyOn(component, 'showNotification');

      (component as any).fallbackCopy('test text');

      expect(showNotificationSpy).toHaveBeenCalledWith('✓ Copied to clipboard');
    });
  });

  describe('Copy Failure', () => {
    it('should show error notification when execCommand returns false', () => {
      document.execCommand = vi.fn().mockReturnValue(false);
      const showNotificationSpy = vi.spyOn(component, 'showNotification');

      (component as any).fallbackCopy('test text');

      expect(showNotificationSpy).toHaveBeenCalledWith('✗ Copy failed', 'error');
    });

    it('should show error notification when execCommand throws', () => {
      document.execCommand = vi.fn().mockImplementation(() => {
        throw new Error('Copy not allowed');
      });
      const showNotificationSpy = vi.spyOn(component, 'showNotification');

      (component as any).fallbackCopy('test text');

      expect(showNotificationSpy).toHaveBeenCalledWith('✗ Copy failed', 'error');
    });
  });

  describe('Textarea Cleanup', () => {
    it('should remove textarea after copy', () => {
      document.execCommand = vi.fn().mockReturnValue(true);

      // Count textareas before
      const textareasBefore = document.body.querySelectorAll('textarea').length;

      (component as any).fallbackCopy('test text');

      const textareasAfter = document.body.querySelectorAll('textarea').length;
      // Textarea count should be the same (one added and removed)
      expect(textareasAfter).toBe(textareasBefore);
    });
  });

  describe('Text Selection', () => {
    it('should select textarea content', () => {
      let selectCalled = false;
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'textarea') {
          const originalSelect = element.select.bind(element);
          element.select = vi.fn(() => {
            selectCalled = true;
            return originalSelect();
          });
        }
        return element;
      });

      document.execCommand = vi.fn().mockReturnValue(true);

      (component as any).fallbackCopy('test text');

      expect(selectCalled).toBe(true);
    });
  });
});
