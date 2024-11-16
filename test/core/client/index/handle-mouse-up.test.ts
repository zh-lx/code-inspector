// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('handleMouseUp', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    
    // 模拟 switch 方法
    component.switch = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Mouse Events', () => {
    it('should reset hoverSwitch and dragging states for mouse event', () => {
      component.hoverSwitch = true;
      component.dragging = true;

      const mouseEvent = new MouseEvent('mouseup');
      component.handleMouseUp(mouseEvent);

      expect(component.hoverSwitch).toBe(false);
      expect(component.dragging).toBe(false);
      expect(component.switch).not.toHaveBeenCalled();
    });

    it('should only reset hoverSwitch when not dragging', () => {
      component.hoverSwitch = true;
      component.dragging = false;

      const mouseEvent = new MouseEvent('mouseup');
      component.handleMouseUp(mouseEvent);

      expect(component.hoverSwitch).toBe(false);
      expect(component.dragging).toBe(false);
      expect(component.switch).not.toHaveBeenCalled();
    });
  });

  describe('Touch Events', () => {
    it('should handle touch event and call switch when dragging', () => {
      component.hoverSwitch = true;
      component.dragging = true;

      const touchEvent = new TouchEvent('touchend');
      component.handleMouseUp(touchEvent);

      expect(component.hoverSwitch).toBe(false);
      expect(component.dragging).toBe(false);
      expect(component.switch).toHaveBeenCalledWith(touchEvent);
    });

    it('should not call switch when not dragging for touch event', () => {
      component.hoverSwitch = true;
      component.dragging = false;

      const touchEvent = new TouchEvent('touchend');
      component.handleMouseUp(touchEvent);

      expect(component.hoverSwitch).toBe(false);
      expect(component.dragging).toBe(false);
      expect(component.switch).not.toHaveBeenCalled();
    });
  });

  describe('State Changes', () => {
    it('should always reset hoverSwitch regardless of event type', () => {
      const testCases = [
        new MouseEvent('mouseup'),
        new TouchEvent('touchend')
      ];

      testCases.forEach(event => {
        component.hoverSwitch = true;
        component.handleMouseUp(event);
        expect(component.hoverSwitch).toBe(false);
      });
    });

    it('should reset dragging state if it was true', () => {
      const testCases = [
        new MouseEvent('mouseup'),
        new TouchEvent('touchend')
      ];

      testCases.forEach(event => {
        component.dragging = true;
        component.handleMouseUp(event);
        expect(component.dragging).toBe(false);
      });
    });
  });

  describe('Event Type Handling', () => {
    it('should differentiate between mouse and touch events', () => {
      // Mouse event
      component.dragging = true;
      const mouseEvent = new MouseEvent('mouseup');
      component.handleMouseUp(mouseEvent);
      expect(component.switch).not.toHaveBeenCalled();

      // Touch event
      component.dragging = true;
      const touchEvent = new TouchEvent('touchend');
      component.handleMouseUp(touchEvent);
      expect(component.switch).toHaveBeenCalledWith(touchEvent);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      // 快速切换状态
      component.hoverSwitch = true;
      component.dragging = true;
      component.handleMouseUp(new MouseEvent('mouseup'));
      component.handleMouseUp(new MouseEvent('mouseup'));

      expect(component.hoverSwitch).toBe(false);
      expect(component.dragging).toBe(false);
    });

    it('should handle multiple consecutive events', () => {
      component.dragging = true;
      
      const events = [
        new TouchEvent('touchend'),
        new MouseEvent('mouseup'),
        new TouchEvent('touchend'),
      ];

      events.forEach(event => {
        component.handleMouseUp(event);
      });

      // 验证 switch 只被调用一次（只有一个 touch 事件）
      expect(component.switch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Method Call Order', () => {
    it('should reset states before calling switch for touch events', () => {
      component.dragging = true;
      component.hoverSwitch = true;
      
      const states: { dragging: boolean, hoverSwitch: boolean }[] = [];
      component.switch = vi.fn(() => {
        states.push({
          dragging: component.dragging,
          hoverSwitch: component.hoverSwitch
        });
      });

      const touchEvent = new TouchEvent('touchend');
      component.handleMouseUp(touchEvent);

      expect(states[0]).toEqual({
        dragging: false,
        hoverSwitch: false
      });
    });
  });
});