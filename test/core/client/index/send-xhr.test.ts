// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('sendXHR', () => {
  let component: CodeInspectorComponent;
  let xhrMock: any;

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

    // 模拟 XMLHttpRequest
    xhrMock = {
      open: vi.fn(),
      send: vi.fn(),
      addEventListener: vi.fn(),
    };
    
    global.XMLHttpRequest = vi.fn(() => xhrMock) as any;
  });

  describe('Basic Functionality', () => {
    it('should create correct URL with encoded path', () => {
      component.sendXHR();

      const expectedUrl = 'http://localhost:3777/?file=%2Fpath%2Fto%2Ffile.ts&line=10&column=5';
      expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl, true);
    });

    it('should send the request', () => {
      component.sendXHR();

      expect(xhrMock.send).toHaveBeenCalled();
    });

    it('should add error event listener', () => {
      component.sendXHR();

      expect(xhrMock.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Error Handling', () => {
    it('should switch to img mode on XHR error', () => {
      // 模拟 sendImg 方法
      component.sendImg = vi.fn();

      // 调用 sendXHR
      component.sendXHR();

      // 获取错误处理函数
      const errorHandler = xhrMock.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];

      // 触发错误
      errorHandler();

      // 验证状态和行为
      expect(component.sendType).toBe('img');
      expect(component.sendImg).toHaveBeenCalled();
    });
  });

  describe('URL Construction', () => {
    it('should handle special characters in path', () => {
      component.element.path = '/path with spaces/file#1.ts';
      component.sendXHR();

      const expectedUrl = `http://localhost:3777/?file=${encodeURIComponent('/path with spaces/file#1.ts')}&line=10&column=5`;
      expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl, true);
    });

    it('should use custom IP and port', () => {
      component.ip = '192.168.1.1';
      component.port = 8080;
      component.sendXHR();

      const expectedUrl = 'http://192.168.1.1:8080/?file=%2Fpath%2Fto%2Ffile.ts&line=10&column=5';
      expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl, true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty path', () => {
      component.element.path = '';
      component.sendXHR();

      const expectedUrl = 'http://localhost:3777/?file=&line=10&column=5';
      expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl, true);
    });

    it('should handle zero line and column', () => {
      component.element.line = 0;
      component.element.column = 0;
      component.sendXHR();

      const expectedUrl = 'http://localhost:3777/?file=%2Fpath%2Fto%2Ffile.ts&line=0&column=0';
      expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl, true);
    });
  });

  describe('Integration', () => {
    it('should work with actual URL encoding', () => {
      component.element.path = '/path/with/@special&chars.ts';
      component.sendXHR();

      const expectedPath = encodeURIComponent('/path/with/@special&chars.ts');
      const expectedUrl = `http://localhost:3777/?file=${expectedPath}&line=10&column=5`;
      expect(xhrMock.open).toHaveBeenCalledWith('GET', expectedUrl, true);
    });

    it('should maintain state after multiple calls', () => {
      // 第一次调用
      component.sendXHR();
      
      // 模拟错误并切换到 img 模式
      const errorHandler = xhrMock.addEventListener.mock.calls[0][1];
      errorHandler();
      
      // 重置 sendType
      component.sendType = 'xhr';
      
      // 第二次调用
      component.sendXHR();
      
      // 验证 XHR 仍然正常工作
      expect(xhrMock.open).toHaveBeenCalledTimes(2);
      expect(xhrMock.send).toHaveBeenCalledTimes(2);
    });
  });
});