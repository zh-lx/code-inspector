// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('handleKeyUp', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    
    // 模拟方法
    component.isTracking = vi.fn().mockReturnValue(false);
    component.removeCover = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should call removeCover when not tracking and not open', () => {
      component.open = false;
      const event = new KeyboardEvent('keyup', { key: 'Alt' });
      
      component.handleKeyUp(event);
      
      expect(component.removeCover).toHaveBeenCalled();
    });

    it('should not call removeCover when tracking', () => {
      // @ts-ignore
      component.isTracking.mockReturnValue(true);
      component.open = false;
      const event = new KeyboardEvent('keyup', { key: 'Alt' });
      
      component.handleKeyUp(event);
      
      expect(component.removeCover).not.toHaveBeenCalled();
    });

    it('should not call removeCover when open', () => {
      component.open = true;
      const event = new KeyboardEvent('keyup', { key: 'Alt' });
      
      component.handleKeyUp(event);
      
      expect(component.removeCover).not.toHaveBeenCalled();
    });
  });

  describe('State Combinations', () => {
    it('should not call removeCover when both tracking and open', () => {
      // @ts-ignore
      component.isTracking.mockReturnValue(true);
      component.open = true;
      const event = new KeyboardEvent('keyup', { key: 'Alt' });
      
      component.handleKeyUp(event);
      
      expect(component.removeCover).not.toHaveBeenCalled();
    });

    it('should call removeCover only in correct state combination', () => {
      const testCases = [
        { isTracking: true, open: true, shouldRemove: false },
        { isTracking: true, open: false, shouldRemove: false },
        { isTracking: false, open: true, shouldRemove: false },
        { isTracking: false, open: false, shouldRemove: true }
      ];

      testCases.forEach(({ isTracking, open, shouldRemove }) => {
        // @ts-ignore
        component.isTracking.mockReturnValue(isTracking);
        component.open = open;

        // @ts-ignore
        component.removeCover.mockClear();

        const event = new KeyboardEvent('keyup', { key: 'Alt' });
        component.handleKeyUp(event);

        if (shouldRemove) {
          expect(component.removeCover).toHaveBeenCalled();
        } else {
          expect(component.removeCover).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Different Key Events', () => {
    it('should handle any key event the same way', () => {
      component.open = false;
      const keys = ['Alt', 'Control', 'Shift', 'A', 'Enter', 'Escape'];
      
      keys.forEach(key => {
        // @ts-ignore
        component.removeCover.mockClear();
        const event = new KeyboardEvent('keyup', { key });
        
        component.handleKeyUp(event);
        
        expect(component.removeCover).toHaveBeenCalled();
      });
    });
  });

  describe('Event Properties', () => {
    it('should handle event with modifiers', () => {
      component.open = false;
      const event = new KeyboardEvent('keyup', {
        key: 'A',
        altKey: true,
        ctrlKey: true,
        shiftKey: true
      });
      
      component.handleKeyUp(event);
      
      expect(component.removeCover).toHaveBeenCalled();
    });
  });
});