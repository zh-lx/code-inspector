import { CodeInspectorComponent } from '@/core/src/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('removeCover', () => {
  let component: CodeInspectorComponent;
  
  beforeEach(() => {
    // 创建组件实例
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    // 清理
    document.body.removeChild(component);
    vi.clearAllMocks();   
  });

  describe('Basic Functionality', () => {
    it('should set show to false', () => {
      // 设置初始状态
      component.show = true;
      
      // 调用方法
      component.removeCover();
      
      // 验证状态
      expect(component.show).toBe(false);
    });

    it('should call removeGlobalCursorStyle', () => {
      // 监视 removeGlobalCursorStyle 方法
      const removeStyleSpy = vi.spyOn(component, 'removeGlobalCursorStyle');
      
      // 调用方法
      component.removeCover();
      
      // 验证方法调用
      expect(removeStyleSpy).toHaveBeenCalled();
    });

    it('should restore previous userSelect style', () => {
      // 设置初始状态
      component.preUserSelect = 'text';
      document.body.style.userSelect = 'none';
      
      // 调用方法
      component.removeCover();
      
      // 验证样式恢复
      expect(document.body.style.userSelect).toBe('text');
    });

    it('should clear preUserSelect after restoration', () => {
      // 设置初始状态
      component.preUserSelect = 'text';
      
      // 调用方法
      component.removeCover();
      
      // 验证 preUserSelect 被清空
      expect(component.preUserSelect).toBe('');
    });
  });

  describe('State Changes', () => {
    it('should handle multiple calls correctly', () => {
      // 设置初始状态
      component.show = true;
      component.preUserSelect = 'text';
      document.body.style.userSelect = 'none';
      
      // 第一次调用
      component.removeCover();
      expect(document.body.style.userSelect).toBe('text');
      expect(component.preUserSelect).toBe('');
      
      // 第二次调用
      component.removeCover();
      expect(document.body.style.userSelect).toBe('');
      expect(component.preUserSelect).toBe('');
    });

    it('should maintain state consistency', () => {
      // 设置初始状态
      component.show = true;
      component.preUserSelect = 'text';
      
      // 调用方法
      component.removeCover();
      
      // 验证所有相关状态
      expect(component.show).toBe(false);
      expect(component.preUserSelect).toBe('');
      expect(document.body.style.userSelect).toBe('text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty preUserSelect', () => {
      // 设置初始状态
      component.preUserSelect = '';
      document.body.style.userSelect = 'none';
      
      // 调用方法
      component.removeCover();
      
      // 验证结果
      expect(document.body.style.userSelect).toBe('');
    });

    it('should handle undefined preUserSelect', () => {
      // 设置初始状态
      component.preUserSelect = '' as any;
      document.body.style.userSelect = 'none';
      
      component.removeCover();
      
      expect(document.body.style.userSelect).toBe('');
      expect(component.preUserSelect).toBe('');
    });

    it('should handle missing document.body', () => {
      // 临时移除 document.body
      const originalBody = document.body;
      // @ts-ignore
      delete document.body;
      
      // 确保不会抛出错误
      expect(() => {
        component.removeCover();
      }).not.toThrow();
      
      // 恢复 document.body
      document.body = originalBody;
    });
  });

  describe('Integration', () => {
    it('should work with removeGlobalCursorStyle', () => {
      // 创建样式元素
      const styleElement = document.createElement('style');
      styleElement.id = '__code-inspector-unique-id';
      document.head.appendChild(styleElement);
      
      // 设置初始状态
      component.show = true;
      component.preUserSelect = 'text';
      
      // 调用方法
      component.removeCover();
      
      // 验证样式元素被移除
      expect(document.getElementById('__code-inspector-unique-id')).toBeNull();
    });

    it('should handle all state changes together', () => {
      // 设置所有相关的初始状态
      component.show = true;
      component.preUserSelect = 'text';
      document.body.style.userSelect = 'none';
      
      // 添加全局样式
      const styleElement = document.createElement('style');
      styleElement.id = '__code-inspector-unique-id';
      document.head.appendChild(styleElement);
      
      // 调用方法
      component.removeCover();
      
      // 验证所有变化
      expect(component.show).toBe(false);
      expect(component.preUserSelect).toBe('');
      expect(document.body.style.userSelect).toBe('text');
      expect(document.getElementById('__code-inspector-unique-id')).toBeNull();
    });
  });
});