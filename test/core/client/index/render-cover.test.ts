// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('CodeInspectorComponent - renderCover method', () => {
  let component: CodeInspectorComponent;
  let targetElement: HTMLElement;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    
    // 模拟目标元素
    targetElement = document.createElement('div');
    document.body.appendChild(targetElement);
    
    // 模拟 getBoundingClientRect
    targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,
      right: 200,
      bottom: 150,
      left: 50
    });

    // 模拟 getComputedStyle
    window.getComputedStyle = vi.fn().mockReturnValue({
      userSelect: 'text',
      getPropertyValue: vi.fn().mockReturnValue('10')
    });

    // 模拟 document.documentElement 尺寸
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1200,
      configurable: true
    });

    // 模拟 getDomPropertyValue 方法
    component.getDomPropertyValue = vi.fn().mockReturnValue(10);
    
    // 模拟 addGlobalCursorStyle 方法
    component.addGlobalCursorStyle = vi.fn();
  });

  describe('Position Calculation', () => {
    it('should calculate and set position correctly', () => {
      component.renderCover(targetElement);

      expect(component.position).toEqual({
        top: 100,
        right: 200,
        bottom: 150,
        left: 50,
        border: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        },
        margin: {
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        }
      });
    });

    it('should calculate info class names correctly', () => {
      component.renderCover(targetElement);

      // 验证类名计算
      expect(component.infoClassName).toEqual({
        vertical: 'element-info-bottom',
        horizon: 'element-info-left'
      });
    });

    it('should calculate info width correctly', () => {
      component.renderCover(targetElement);

      expect(component.infoWidth).toBe('300px');
    });
  });

  describe('Element Information', () => {
    it('should parse path attribute correctly', () => {
      targetElement.setAttribute(PathName, '/path/to/file.ts:10:5:div');
      
      component.renderCover(targetElement);

      expect(component.element).toEqual({
        name: 'div',
        path: '/path/to/file.ts',
        line: 10,
        column: 5
      });
    });

    it('should handle Astro source information', () => {
      targetElement.setAttribute('data-astro-source-file', '/astro/file.ts');
      targetElement.setAttribute('data-astro-source-loc', '15:10');
      
      component.renderCover(targetElement);

      expect(component.element).toEqual({
        name: targetElement.tagName.toLowerCase(),
        path: '/astro/file.ts',
        line: 15,
        column: 10
      });
    });

    it('should handle missing path information', () => {
      component.renderCover(targetElement);

      expect(component.element).toEqual({
        name: '',
        path: '',
        line: NaN,
        column: NaN
      });
    });
  });

  describe('Style Handling', () => {
    it('should store and set userSelect style', () => {
      component.renderCover(targetElement);

      expect(component.preUserSelect).toBe('text');
      expect(document.body.style.userSelect).toBe('none');
    });

    it('should not override existing preUserSelect', () => {
      component.preUserSelect = 'existing';
      component.renderCover(targetElement);

      expect(component.preUserSelect).toBe('existing');
    });

    it('should call addGlobalCursorStyle', () => {
      component.renderCover(targetElement);

      expect(component.addGlobalCursorStyle).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero dimensions', () => {
      targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });

      component.renderCover(targetElement);

      expect(component.infoWidth).toBe('300px');
    });

    it('should handle negative positions', () => {
      targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: -100,
        right: 200,
        bottom: -50,
        left: -50
      });

      component.renderCover(targetElement);

      expect(component.position.top).toBe(-100);
      expect(component.position.left).toBe(-50);
    });

    it('should handle malformed path string', () => {
      targetElement.setAttribute(PathName, 'invalid:path:string');
      
      component.renderCover(targetElement);

      expect(component.element.path).toBe('');
      expect(component.element.line).toBe(NaN);
    });
  });

  describe('Viewport Calculations', () => {
    it('should handle element near viewport edges', () => {
      // 模拟元素靠近视口边缘
      targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 50,
        right: 1150,
        bottom: 750,
        left: 50
      });

      component.renderCover(targetElement);

      expect(component.infoClassName.vertical).toBe('element-info-bottom-inner');
      expect(component.infoClassName.horizon).toBe('element-info-right');
    });

    it('should handle element near viewport edges', () => {
      // 模拟元素靠近视口边缘
      targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 3000,
        right: 1150,
        bottom: 0,
        height: 20,
        left: 50
      });

      component.renderCover(targetElement);

      expect(component.infoClassName.vertical).toBe('element-info-top');
      expect(component.infoClassName.horizon).toBe('element-info-right');
    });

    it('should handle element near viewport edges top', () => {
      // 模拟元素靠近视口边缘
      targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 1000,
        right: 1150,
        bottom: 10,
        height: 20,
        left: 50
      });
      component.getDomPropertyValue = vi.fn().mockReturnValue(990);
      component.renderCover(targetElement);

      expect(component.infoClassName.vertical).toBe('element-info-top-inner');
      expect(component.infoClassName.horizon).toBe('element-info-right');
    });

    it('should handle element larger than viewport', () => {
      targetElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: -100,
        right: 1300,
        bottom: 900,
        left: -50
      });

      component.renderCover(targetElement);

      // 验证宽度计算
      expect(parseInt(component.infoWidth)).toBeGreaterThan(300);
    });
  });
});