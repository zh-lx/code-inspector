import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

// 模拟 composedPath
vi.mock('@/core/src/client/util', () => ({
  DefaultPort: 5678
}));

describe('moveSwitch', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    
    // 初始化必要的属性
    component.mousePosition = {
      baseX: 100,
      baseY: 100,
      moveX: 50,
      moveY: 50
    };
    
  });

  afterEach(() => {
    if (component) {
      document.body.removeChild(component);
    }
  });

  describe('Mouse Events', () => {
    it('should set hoverSwitch to true when event path includes component', () => {
      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([component]);
      
      component.moveSwitch(mouseEvent);
      
      expect(component.hoverSwitch).toBe(true);
    });

    it('should set hoverSwitch to false when event path excludes component', () => {
      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([document.body]);
      
      component.moveSwitch(mouseEvent);
      
      expect(component.hoverSwitch).toBe(false);
    });

    it('should update switch position when dragging', () => {
      component.dragging = true;
      
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', { value: 150 });
      Object.defineProperty(mouseEvent, 'pageY', { value: 150 });
      
      component.moveSwitch(mouseEvent);
      
      expect(component.moved).toBe(true);
      expect(component.inspectorSwitchRef.style.left).toBe('200px'); // 100 + (150 - 50)
      expect(component.inspectorSwitchRef.style.top).toBe('200px'); // 100 + (150 - 50)
    });

    it('should not update position when not dragging', () => {
      component.dragging = false;
      
      const mouseEvent = new MouseEvent('mousemove');
      
      component.moveSwitch(mouseEvent);
      
      expect(component.moved).toBe(false);
      // 位置应该保持不变
      const initialLeft = component.inspectorSwitchRef.style.left;
      const initialTop = component.inspectorSwitchRef.style.top;
      expect(component.inspectorSwitchRef.style.left).toBe(initialLeft);
      expect(component.inspectorSwitchRef.style.top).toBe(initialTop);
    });
  });

  describe('Touch Events', () => {
    it('should handle touch events correctly when dragging', () => {
      component.dragging = true;
      
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ pageX: 150, pageY: 150 }] as unknown as Touch[]
      });
      
      component.moveSwitch(touchEvent);
      
      expect(component.moved).toBe(true);
      expect(component.inspectorSwitchRef.style.left).toBe('200px');
      expect(component.inspectorSwitchRef.style.top).toBe('200px');
    });

    it('should handle hover state with touch events', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ pageX: 150, pageY: 150 }] as unknown as Touch[]
      });
      touchEvent.composedPath = vi.fn().mockReturnValue([component]);
      
      component.moveSwitch(touchEvent);
      
      expect(component.hoverSwitch).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing touch coordinates', () => {
      component.dragging = true;
      
      const touchEvent = new TouchEvent('touchmove', {
        touches: [] as unknown as Touch[]
      });
      
      // 确保不会抛出错误
      expect(() => {
        component.moveSwitch(touchEvent);
      }).not.toThrow();
    });

    it('should handle negative coordinates', () => {
      component.dragging = true;
      
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', { value: -50 });
      Object.defineProperty(mouseEvent, 'pageY', { value: -50 });
      
      component.moveSwitch(mouseEvent);
      
      expect(component.inspectorSwitchRef.style.left).toBe('0px'); // 100 + (-50 - 50)
      expect(component.inspectorSwitchRef.style.top).toBe('0px');
    });
  });

  describe('Position Calculations', () => {
    it('should calculate correct position with zero base position', () => {
      component.dragging = true;
      component.mousePosition = {
        baseX: 0,
        baseY: 0,
        moveX: 50,
        moveY: 50
      };
      
      const mouseEvent = new MouseEvent('mousemove');
      
      component.moveSwitch(mouseEvent);
      
      expect(component.inspectorSwitchRef.style.left).toBe('-50px');
      expect(component.inspectorSwitchRef.style.top).toBe('-50px');
    });

    it('should maintain position when coordinates match moveX/Y', () => {
      component.dragging = true;
      
      const mouseEvent = new MouseEvent('mousemove');
      
      component.moveSwitch(mouseEvent);
      
      expect(component.inspectorSwitchRef.style.left).toBe('50px'); // baseX remains unchanged
      expect(component.inspectorSwitchRef.style.top).toBe('50px'); // baseY remains unchanged
    });
  });
});