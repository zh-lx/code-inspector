import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('recordMousePosition', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);

    // 模拟 getMousePosition 方法
    component.getMousePosition = vi.fn().mockReturnValue({ x: 100, y: 200 });
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Mouse Events', () => {
    it('should record mouse position correctly for mouse event', () => {
      // 设置 inspectorSwitchRef 的位置
      Object.defineProperty(component.inspectorSwitchRef, 'offsetLeft', {
        value: 50,
        configurable: true
      });
      Object.defineProperty(component.inspectorSwitchRef, 'offsetTop', {
        value: 60,
        configurable: true
      });

      const mouseEvent = new MouseEvent('mousedown');
      Object.defineProperty(mouseEvent, 'pageX', {
        value: 100,
        writable: true
      });
      Object.defineProperty(mouseEvent, 'pageY', {
        value: 200,
        writable: true
      });
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent);

      expect(component.mousePosition).toEqual({
        baseX: 50,
        baseY: 60,
        moveX: 100,
        moveY: 200
      });
      expect(component.dragging).toBe(true);
      expect(mouseEvent.preventDefault).toHaveBeenCalled();
    });

    it('should handle zero offset positions', () => {
      Object.defineProperty(component.inspectorSwitchRef, 'offsetLeft', {
        value: 0,
        configurable: true
      });
      Object.defineProperty(component.inspectorSwitchRef, 'offsetTop', {
        value: 0,
        configurable: true
      });

      const mouseEvent = new MouseEvent('mousedown');
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent);

      expect(component.mousePosition).toEqual({
        baseX: 0,
        baseY: 0,
        moveX: 100,
        moveY: 200
      });
    });
  });

  describe('Touch Events', () => {
    it('should record touch position correctly', () => {
      Object.defineProperty(component.inspectorSwitchRef, 'offsetLeft', {
        value: 30,
        configurable: true
      });
      Object.defineProperty(component.inspectorSwitchRef, 'offsetTop', {
        value: 40,
        configurable: true
      });

      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ pageX: 100, pageY: 200 }] as unknown as Touch[]
      });
      touchEvent.preventDefault = vi.fn();

      component.recordMousePosition(touchEvent);

      expect(component.mousePosition).toEqual({
        baseX: 30,
        baseY: 40,
        moveX: 100,
        moveY: 200
      });
      expect(component.dragging).toBe(true);
      expect(touchEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('State Changes', () => {
    it('should set dragging state to true', () => {
      const mouseEvent = new MouseEvent('mousedown');
      mouseEvent.preventDefault = vi.fn();

      expect(component.dragging).toBe(false);
      component.recordMousePosition(mouseEvent);
      expect(component.dragging).toBe(true);
    });
  });

  describe('Event Prevention', () => {
    it('should prevent default event behavior', () => {
      const mouseEvent = new MouseEvent('mousedown');
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent);

      expect(mouseEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative offset values', () => {
      Object.defineProperty(component.inspectorSwitchRef, 'offsetLeft', {
        value: -10,
        configurable: true
      });
      Object.defineProperty(component.inspectorSwitchRef, 'offsetTop', {
        value: -20,
        configurable: true
      });

      const mouseEvent = new MouseEvent('mousedown');
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent);

      expect(component.mousePosition).toEqual({
        baseX: -10,
        baseY: -20,
        moveX: 100,
        moveY: 200
      });
    });

    it('should handle undefined mouse position', () => {
      component.getMousePosition = vi.fn().mockReturnValue({ x: undefined, y: undefined });

      const mouseEvent = new MouseEvent('mousedown');
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent);

      expect(component.mousePosition).toEqual({
        baseX: component.inspectorSwitchRef.offsetLeft,
        baseY: component.inspectorSwitchRef.offsetTop,
        moveX: undefined,
        moveY: undefined
      });
    });

    it('should handle large offset values', () => {
      Object.defineProperty(component.inspectorSwitchRef, 'offsetLeft', {
        value: 99999,
        configurable: true
      });
      Object.defineProperty(component.inspectorSwitchRef, 'offsetTop', {
        value: 99999,
        configurable: true
      });

      const mouseEvent = new MouseEvent('mousedown');
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent);

      expect(component.mousePosition).toEqual({
        baseX: 99999,
        baseY: 99999,
        moveX: 100,
        moveY: 200
      });
    });
  });
});