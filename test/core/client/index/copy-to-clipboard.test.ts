// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('CodeInspectorComponent - copyToClipboard method', () => {
  let component: CodeInspectorComponent;
  const testText = 'test text to copy';

  beforeEach(() => {
    component = new CodeInspectorComponent();
    // 清理 body
    document.body.innerHTML = '';
  });

  describe('Modern Clipboard API', () => {
    beforeEach(() => {
      // 模拟现代剪贴板 API
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined)
        },
        configurable: true
      });
    });

    it('should use clipboard API when available', () => {
      component.copyToClipboard(testText);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
    });

    it('should not create textarea when using clipboard API', () => {
      component.copyToClipboard(testText);
      
      expect(document.querySelector('textarea')).toBeNull();
    });
  });

  describe('Legacy Approach', () => {
    beforeEach(() => {
      // 移除现代剪贴板 API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true
      });
      
      // 模拟 execCommand
      document.execCommand = vi.fn();
    });

    it('should create and use textarea when clipboard API is not available', () => {
      component.copyToClipboard(testText);
      
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    it('should remove textarea after copying', () => {
      component.copyToClipboard(testText);
      
      expect(document.querySelector('textarea')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true
      });

      component.copyToClipboard('');
      
      expect(writeText).toHaveBeenCalledWith('');
    });

    it('should handle long text', () => {
      const longText = 'a'.repeat(1000);
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true
      });

      component.copyToClipboard(longText);
      
      expect(writeText).toHaveBeenCalledWith(longText);
    });

    it('should handle special characters', () => {
      const specialText = '!@#$%^&*()_+\n\t';
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true
      });

      component.copyToClipboard(specialText);
      
      expect(writeText).toHaveBeenCalledWith(specialText);
    });
  });

  describe('Error Handling', () => {
    it('should handle clipboard API failure gracefully', () => {
      // 模拟 clipboard API 失败
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockRejectedValue(new Error('Clipboard error'))
        },
        configurable: true
      });

      // 确保不会抛出错误
      expect(() => {
        component.copyToClipboard(testText);
      }).not.toThrow();
    });

    it('should use fallback when navigator.clipboard.writeText throws synchronously', () => {
      // 模拟 clipboard API 同步抛出异常
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockImplementation(() => {
            throw new Error('Sync error');
          })
        },
        configurable: true
      });

      document.execCommand = vi.fn().mockReturnValue(true);

      // 确保不会抛出错误
      expect(() => {
        component.copyToClipboard(testText);
      }).not.toThrow();

      // 应该调用 fallback
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

});