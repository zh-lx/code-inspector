import { CodeInspectorComponent } from '@/core/src/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('addGlobalCursorStyle', () => {
  let component: CodeInspectorComponent;
  const styleId = '__code-inspector-unique-id';
  
  beforeEach(() => {
    // 创建组件实例
    component = new CodeInspectorComponent();
    document.body.appendChild(component);

    // 确保每个测试前移除可能存在的样式元素
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
  });

  afterEach(() => {
    // 清理
    document.body.innerHTML = '';
  });

  describe('Basic Functionality', () => {
    it('should add style element with correct ID', () => {
      component.addGlobalCursorStyle();
      
      const styleElement = document.getElementById(styleId);
      expect(styleElement).toBeTruthy();
      expect(styleElement?.tagName.toLowerCase()).toBe('style');
    });

    it('should set correct cursor style', () => {
      component.addGlobalCursorStyle();
      
      const styleElement = document.getElementById(styleId);
      expect(styleElement?.innerText).toContain('cursor: pointer !important');
    });

    it('should append style element to document body', () => {
      component.addGlobalCursorStyle();
      
      const styleElement = document.getElementById(styleId);
      expect(document.body.contains(styleElement)).toBe(true);
    });
  });

  describe('Multiple Calls', () => {
    it('should not add duplicate style elements', () => {
      // 调用两次
      component.addGlobalCursorStyle();
      component.addGlobalCursorStyle();
      
      // 检查是否只有一个样式元素
      const styleElements = document.querySelectorAll(`#${styleId}`);
      expect(styleElements.length).toBe(1);
    });

    it('should preserve existing style element', () => {
      // 第一次调用
      component.addGlobalCursorStyle();
      const firstStyle = document.getElementById(styleId);
      
      // 第二次调用
      component.addGlobalCursorStyle();
      const secondStyle = document.getElementById(styleId);
      
      // 验证是同一个元素
      expect(firstStyle).toBe(secondStyle);
    });
  });

  describe('Edge Cases', () => {
    it('should handle case when document.body is not available', () => {
      // 临时移除 body
      const originalBody = document.body;
      // @ts-ignore
      delete document.body;
      
      // 确保不会抛出错误
      expect(() => {
        component.addGlobalCursorStyle();
      }).not.toThrow();
      
      // 恢复 body
      document.body = originalBody;
    });

    it('should handle case when style element already exists with different content', () => {
      // 创建一个已存在的样式元素
      const existingStyle = document.createElement('style');
      existingStyle.setAttribute('id', styleId);
      existingStyle.innerText = 'body { background: red; }';
      document.body.prepend(existingStyle);
      
      // 调用方法
      component.addGlobalCursorStyle();
      
      // 验证样式元素没有被改变
      const styleElement = document.getElementById(styleId);
      expect(styleElement?.innerText).toBe('body { background: red; }');
    });
  });

  describe('Style Content', () => {
    it('should set correct CSS selector and properties', () => {
      component.addGlobalCursorStyle();
      
      const styleElement = document.getElementById(styleId);
      const styleContent = styleElement?.innerText.replace(/\s+/g, ' ').trim();
      
      expect(styleContent).toBe('body * { cursor: pointer !important; }');
    });

    it('should include !important flag', () => {
      component.addGlobalCursorStyle();
      
      const styleElement = document.getElementById(styleId);
      expect(styleElement?.innerText).toContain('!important');
    });
  });

  describe('DOM Integration', () => {
    it('should work with existing styles in document', () => {
      // 添加一个已存在的样式元素
      const existingStyle = document.createElement('style');
      document.head.appendChild(existingStyle);
      
      component.addGlobalCursorStyle();
      
      // 验证新样式被正确添加
      expect(document.getElementById(styleId)).toBeTruthy();
    });

    it('should maintain style element in document after DOM updates', () => {
      component.addGlobalCursorStyle();
      
      // 模拟 DOM 更新
      document.body.innerHTML += '<div>New content</div>';
      
      // 验证样式元素仍然存在
      expect(document.getElementById(styleId)).toBeTruthy();
    });
  });
});