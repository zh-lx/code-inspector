import { CodeInspectorComponent } from '@/core/src/client';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('removeGlobalCursorStyle', () => {
  let component: CodeInspectorComponent;
  const styleId = '__code-inspector-unique-id';

  beforeEach(() => {
    // 创建组件实例
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    // 清理
    document.body.innerHTML = '';
  });

  describe('Basic Functionality', () => {
    it('should remove style element when it exists', () => {
      // 创建样式元素
      const style = document.createElement('style');
      style.id = styleId;
      document.body.appendChild(style);

      // 调用移除方法
      component.removeGlobalCursorStyle();

      // 验证样式元素已被移除
      expect(document.getElementById(styleId)).toBeNull();
    });

    it('should not throw error when style element does not exist', () => {
      // 确保样式元素不存在
      expect(document.getElementById(styleId)).toBeNull();

      // 验证调用方法不会抛出错误
      expect(() => {
        component.removeGlobalCursorStyle();
      }).not.toThrow();
    });
  });

  describe('Multiple Calls', () => {
    it('should be safe to call multiple times', () => {
      // 创建样式元素
      const style = document.createElement('style');
      style.id = styleId;
      document.body.appendChild(style);

      // 多次调用移除方法
      component.removeGlobalCursorStyle();
      component.removeGlobalCursorStyle();
      component.removeGlobalCursorStyle();

      // 验证样式元素已被移除
      expect(document.getElementById(styleId)).toBeNull();
    });

    it('should maintain document state after multiple calls', () => {
      // 添加其他样式元素
      const otherStyle = document.createElement('style');
      otherStyle.id = 'other-style';
      document.body.appendChild(otherStyle);

      // 多次调用移除方法
      component.removeGlobalCursorStyle();
      component.removeGlobalCursorStyle();

      // 验证其他样式元素未被影响
      expect(document.getElementById('other-style')).not.toBeNull();
    });
  });
});