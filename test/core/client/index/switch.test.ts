// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('switch', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  describe('Basic Functionality', () => {
    it('should toggle open state when not moved', () => {
      component.moved = false;
      component.open = false;
      
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      component.switch(event);

      expect(component.open).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not toggle open state when moved', () => {
      component.moved = true;
      component.open = false;
      
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      component.switch(event);

      expect(component.open).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('State Changes', () => {
    it('should reset moved state to false after switch', () => {
      component.moved = true;
      
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      component.switch(event);

      expect(component.moved).toBe(false);
    });

    it('should toggle open state from true to false', () => {
      component.moved = false;
      component.open = true;
      
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      component.switch(event);

      expect(component.open).toBe(false);
    });
  });

  describe('Event Handling', () => {
    it('should prevent default and stop propagation only when not moved', () => {
      const testCases = [
        { moved: false, shouldPrevent: true },
        { moved: true, shouldPrevent: false }
      ];

      testCases.forEach(({ moved, shouldPrevent }) => {
        component.moved = moved;
        
        const event = new Event('click', { bubbles: true, cancelable: true });
        event.preventDefault = vi.fn();
        event.stopPropagation = vi.fn();

        component.switch(event);

        if (shouldPrevent) {
          expect(event.preventDefault).toHaveBeenCalled();
          expect(event.stopPropagation).toHaveBeenCalled();
        } else {
          expect(event.preventDefault).not.toHaveBeenCalled();
          expect(event.stopPropagation).not.toHaveBeenCalled();
        }
      });
    });

    it('should handle different event types', () => {
      component.moved = false;
      
      const events = [
        new MouseEvent('click'),
        new TouchEvent('touchend'),
        new Event('custom')
      ];

      events.forEach(event => {
        event.preventDefault = vi.fn();
        event.stopPropagation = vi.fn();
        
        component.switch(event);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple consecutive switches', () => {
      component.moved = false;
      component.open = false;
      
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      // 连续调用三次
      component.switch(event); // false -> true
      expect(component.open).toBe(true);
      
      component.switch(event); // true -> false
      expect(component.open).toBe(false);
      
      component.switch(event); // false -> true
      expect(component.open).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle event with preventDefault disabled', () => {
      component.moved = false;
      
      const event = new Event('click', { bubbles: true, cancelable: false });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      // 不应该抛出错误
      expect(() => {
        component.switch(event);
      }).not.toThrow();
    });

    it('should maintain correct state after rapid switches', () => {
      component.moved = false;
      component.open = false;
      
      const event = new Event('click', { bubbles: true, cancelable: true });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      // 快速连续切换
      for (let i = 0; i < 10; i++) {
        component.switch(event);
      }

      // 10次切换后应该回到初始状态
      expect(component.open).toBe(false);
    });
  });
});