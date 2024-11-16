// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('handlePointerDown', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    // @ts-ignore: jsdom 不支持 PointerEvent
    window.PointerEvent = MouseEvent;
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    
    // 模拟方法
    component.isTracking = vi.fn().mockReturnValue(true);
    component.trackCode = vi.fn();
    component.removeCover = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Disabled Element Detection', () => {
    it('should handle directly disabled element', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });

    it('should handle disabled parent element', () => {
      const parent = document.createElement('fieldset');
      parent.disabled = true;
      const child = document.createElement('input');
      parent.appendChild(child);
      
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'target', { value: child });

      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });

    it('should not trigger for non-disabled elements', () => {
      const input = document.createElement('input');
      
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).not.toHaveBeenCalled();
      expect(component.removeCover).not.toHaveBeenCalled();
    });

    it('should handle deeply nested disabled element', () => {
      const grandparent = document.createElement('fieldset');
      grandparent.disabled = true;
      const parent = document.createElement('div');
      const child = document.createElement('input');
      parent.appendChild(child);
      grandparent.appendChild(parent);
      
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'target', { value: child });

      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should prevent default and stop propagation when conditions met', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true
      });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.handlePointerDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not handle event when show is false', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true
      });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();
      Object.defineProperty(event, 'target', { value: input });

      component.show = false;
      component.handlePointerDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('Auto Toggle Behavior', () => {
    it('should set open to false when autoToggle is true', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown');
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.open = true;
      component.autoToggle = true;
      component.handlePointerDown(event);

      expect(component.open).toBe(false);
    });

    it('should maintain open state when autoToggle is false', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown');
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.open = true;
      component.autoToggle = false;
      component.handlePointerDown(event);

      expect(component.open).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null parent element', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'parentElement', { value: null });
      
      const event = new PointerEvent('pointerdown');
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.handlePointerDown(event);

      // 应该正常完成而不抛出错误
      expect(() => component.handlePointerDown(event)).not.toThrow();
    });

    it('should handle detached DOM elements', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown');
      Object.defineProperty(event, 'target', { value: input });

      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).toHaveBeenCalled();
    });
  });

  describe('Tracking and Open State', () => {
    it('should handle when isTracking is false but open is true', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown');
      Object.defineProperty(event, 'target', { value: input });

      // @ts-ignore
      component.isTracking.mockReturnValue(false);
      component.open = true;
      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).toHaveBeenCalled();
    });

    it('should not handle when both isTracking is false and open is false', () => {
      const input = document.createElement('input');
      input.disabled = true;
      
      const event = new PointerEvent('pointerdown');
      Object.defineProperty(event, 'target', { value: input });

      // @ts-ignore
      component.isTracking.mockReturnValue(false);
      component.open = false;
      component.show = true;
      component.handlePointerDown(event);

      expect(component.trackCode).not.toHaveBeenCalled();
    });
  });
});