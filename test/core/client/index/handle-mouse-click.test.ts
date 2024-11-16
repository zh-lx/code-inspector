// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('handleMouseClick', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
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

  describe('Basic Functionality', () => {
    it('should handle click when tracking and show is true', () => {
      component.show = true;
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn();
      mouseEvent.preventDefault = vi.fn();

      component.handleMouseClick(mouseEvent);

      expect(mouseEvent.stopPropagation).toHaveBeenCalled();
      expect(mouseEvent.preventDefault).toHaveBeenCalled();
      expect(component.trackCode).toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });

    it('should handle click when open and show is true', () => {
      component.open = true;
      component.show = true;
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn();
      mouseEvent.preventDefault = vi.fn();

      component.handleMouseClick(mouseEvent);

      expect(mouseEvent.stopPropagation).toHaveBeenCalled();
      expect(mouseEvent.preventDefault).toHaveBeenCalled();
      expect(component.trackCode).toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });
  });

  describe('Auto Toggle Behavior', () => {
    it('should set open to false when autoToggle is true', () => {
      component.show = true;
      component.open = true;
      component.autoToggle = true;
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn();
      mouseEvent.preventDefault = vi.fn();

      component.handleMouseClick(mouseEvent);

      expect(component.open).toBe(false);
    });

    it('should not change open state when autoToggle is false', () => {
      component.show = true;
      component.open = true;
      component.autoToggle = false;
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn();
      mouseEvent.preventDefault = vi.fn();

      component.handleMouseClick(mouseEvent);

      expect(component.open).toBe(true);
    });
  });

  describe('No Action Conditions', () => {
    it('should not take action when show is false', () => {
      component.show = false;
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn();
      mouseEvent.preventDefault = vi.fn();

      component.handleMouseClick(mouseEvent);

      expect(mouseEvent.stopPropagation).not.toHaveBeenCalled();
      expect(mouseEvent.preventDefault).not.toHaveBeenCalled();
      expect(component.trackCode).not.toHaveBeenCalled();
      expect(component.removeCover).not.toHaveBeenCalled();
    });

    it('should not take action when neither tracking nor open', () => {
      component.show = true;
      component.open = false;
      // @ts-ignore
      component.isTracking.mockReturnValue(false);
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn();
      mouseEvent.preventDefault = vi.fn();

      component.handleMouseClick(mouseEvent);

      expect(mouseEvent.stopPropagation).not.toHaveBeenCalled();
      expect(mouseEvent.preventDefault).not.toHaveBeenCalled();
      expect(component.trackCode).not.toHaveBeenCalled();
      expect(component.removeCover).not.toHaveBeenCalled();
    });
  });

  describe('Touch Events', () => {
    it('should handle touch events correctly', () => {
      component.show = true;
      const touchEvent = new TouchEvent('touchstart');
      touchEvent.stopPropagation = vi.fn();
      touchEvent.preventDefault = vi.fn();

      component.handleMouseClick(touchEvent);

      expect(touchEvent.stopPropagation).toHaveBeenCalled();
      expect(touchEvent.preventDefault).toHaveBeenCalled();
      expect(component.trackCode).toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });
  });

  describe('Method Call Order', () => {
    it('should call methods in correct order', () => {
      const calls: string[] = [];
      component.show = true;
      component.autoToggle = true;
      
      // 模拟方法以记录调用顺序
      component.trackCode = vi.fn(() => calls.push('trackCode'));
      component.removeCover = vi.fn(() => calls.push('removeCover'));
      
      const mouseEvent = new MouseEvent('click');
      mouseEvent.stopPropagation = vi.fn(() => calls.push('stopPropagation'));
      mouseEvent.preventDefault = vi.fn(() => calls.push('preventDefault'));

      component.handleMouseClick(mouseEvent);

      expect(calls).toEqual([
        'stopPropagation',
        'preventDefault',
        'trackCode',
        'removeCover'
      ]);
    });
  });
});