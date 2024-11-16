import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('sendImg', () => {
  let component: CodeInspectorComponent;
  let createElement: typeof document.createElement;

  beforeEach(() => {
    // 创建组件实例
    component = new CodeInspectorComponent();
    
    // 设置初始状态
    component.ip = 'localhost';
    component.port = 3777;
    component.element = {
      path: '/path/to/file.ts',
      line: 10,
      column: 5,
      name: 'test'
    };

    // 保存原始的 createElement 方法
    createElement = document.createElement;
  });

  afterEach(() => {
    // 恢复原始的 createElement 方法
    document.createElement = createElement;
  });

  describe('Basic Functionality', () => {
    it('should create an img element with correct src', () => {
      let createdImg: HTMLImageElement | null = null;
      
      // 模拟 createElement 以捕获创建的图片元素
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'img') {
          createdImg = createElement.call(document, 'img') as HTMLImageElement;
          return createdImg!;
        }
        return createElement.call(document, tagName)!;
      });

      component.sendImg();
      
      // 验证图片元素创建
      expect(document.createElement).toHaveBeenCalledWith('img');
      expect(createdImg).toBeTruthy();
      
      // 验证 src 属性
      const expectedUrl = 'http://localhost:3777/?file=%2Fpath%2Fto%2Ffile.ts&line=10&column=5';
      expect(createdImg!.src).toBe(expectedUrl);
    });
  });

  describe('URL Construction', () => {
    it('should handle special characters in path', () => {
      let createdImg: HTMLImageElement | null = null;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'img') {
          createdImg = createElement.call(document, 'img') as HTMLImageElement;
          return createdImg;
        }
        return createElement.call(document, tagName);
      });

      component.element.path = '/path with spaces/file#1.ts';
      component.sendImg();
      
      const expectedUrl = `http://localhost:3777/?file=${encodeURIComponent('/path with spaces/file#1.ts')}&line=10&column=5`;
      expect(createdImg!.src).toBe(expectedUrl);
    });

    it('should use custom IP and port', () => {
      let createdImg: HTMLImageElement | null = null;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'img') {
          createdImg = createElement.call(document, 'img') as HTMLImageElement;
          return createdImg;
        }
        return createElement.call(document, tagName);
      });

      component.ip = '192.168.1.1';
      component.port = 8080;
      component.sendImg();
      
      const expectedUrl = 'http://192.168.1.1:8080/?file=%2Fpath%2Fto%2Ffile.ts&line=10&column=5';
      expect(createdImg!.src).toBe(expectedUrl);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty path', () => {
      let createdImg: HTMLImageElement | null = null;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'img') {
          createdImg = createElement.call(document, 'img') as HTMLImageElement;
          return createdImg;
        }
        return createElement.call(document, tagName);
      });

      component.element.path = '';
      component.sendImg();
      
      const expectedUrl = 'http://localhost:3777/?file=&line=10&column=5';
      expect(createdImg!.src).toBe(expectedUrl);
    });

    it('should handle undefined element properties', () => {
      let createdImg: HTMLImageElement | null = null;
      document.createElement = vi.fn((tagName: string) => {
        if (tagName === 'img') {
          createdImg = createElement.call(document, 'img') as HTMLImageElement;
          return createdImg;
        }
        return createElement.call(document, tagName);
      });

      // @ts-ignore
      component.element = {};
      component.sendImg();
      
      const expectedUrl = 'http://localhost:3777/?file=undefined&line=undefined&column=undefined';
      expect(createdImg!.src).toBe(expectedUrl);
    });
  });
});