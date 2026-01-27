// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('handleMouseClick', () => {
  let component: CodeInspectorComponent;

  beforeEach(async () => {
    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  const createMouseEvent = (composedPath: EventTarget[] = []) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
    });
    event.composedPath = vi.fn().mockReturnValue(composedPath);
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    return event;
  };

  describe('Tracking or Open Condition', () => {
    it('should trigger actions when isTracking returns true and show is true', async () => {
      component.isTracking = vi.fn().mockReturnValue(true);
      component.show = true;
      component.element = { name: 'div', path: '/path/file.ts', line: 10, column: 5 };

      const trackCodeSpy = vi.spyOn(component, 'trackCode').mockImplementation(() => {});
      const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(trackCodeSpy).toHaveBeenCalled();
      expect(removeCoverSpy).toHaveBeenCalled();
    });

    it('should trigger actions when open is true and show is true', async () => {
      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = true;
      component.show = true;
      component.element = { name: 'div', path: '/path/file.ts', line: 10, column: 5 };

      const trackCodeSpy = vi.spyOn(component, 'trackCode').mockImplementation(() => {});
      const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(trackCodeSpy).toHaveBeenCalled();
      expect(removeCoverSpy).toHaveBeenCalled();
    });

    it('should not trigger actions when show is false', async () => {
      component.isTracking = vi.fn().mockReturnValue(true);
      component.show = false;

      const trackCodeSpy = vi.spyOn(component, 'trackCode').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(trackCodeSpy).not.toHaveBeenCalled();
    });

    it('should not trigger actions when neither tracking nor open', async () => {
      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = false;
      component.show = true;

      const trackCodeSpy = vi.spyOn(component, 'trackCode').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(trackCodeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Auto Toggle', () => {
    it('should set open to false when autoToggle is true', async () => {
      component.isTracking = vi.fn().mockReturnValue(true);
      component.show = true;
      component.open = true;
      component.autoToggle = true;
      component.element = { name: 'div', path: '/path/file.ts', line: 10, column: 5 };

      vi.spyOn(component, 'trackCode').mockImplementation(() => {});
      vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(component.open).toBe(false);
    });

    it('should not change open when autoToggle is false', async () => {
      component.isTracking = vi.fn().mockReturnValue(true);
      component.show = true;
      component.open = true;
      component.autoToggle = false;
      component.element = { name: 'div', path: '/path/file.ts', line: 10, column: 5 };

      vi.spyOn(component, 'trackCode').mockImplementation(() => {});
      vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(component.open).toBe(true);
    });
  });

  describe('Layer Panel Removal', () => {
    it('should call removeLayerPanel when click is outside nodeTree', async () => {
      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = false;

      const removeLayerPanelSpy = vi.spyOn(component, 'removeLayerPanel').mockImplementation(() => {});

      const event = createMouseEvent([document.body]);
      component.handleMouseClick(event);

      expect(removeLayerPanelSpy).toHaveBeenCalled();
    });

    it('should not call removeLayerPanel when click is inside nodeTree', async () => {
      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = false;
      component.showNodeTree = true;
      await component.updateComplete;

      const removeLayerPanelSpy = vi.spyOn(component, 'removeLayerPanel').mockImplementation(() => {});

      // Include nodeTreeRef in composedPath
      const nodeTreeRef = component.nodeTreeRef;
      const event = createMouseEvent([nodeTreeRef, document.body]);
      component.handleMouseClick(event);

      expect(removeLayerPanelSpy).not.toHaveBeenCalled();
    });
  });

  describe('Touch Events', () => {
    it('should handle touch events', async () => {
      component.isTracking = vi.fn().mockReturnValue(true);
      component.show = true;
      component.element = { name: 'div', path: '/path/file.ts', line: 10, column: 5 };

      vi.spyOn(component, 'trackCode').mockImplementation(() => {});
      vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      const touch = { clientX: 100, clientY: 100, identifier: 0, target: document.body };
      const touchEvent = new TouchEvent('touchend', {
        touches: [],
        changedTouches: [touch as Touch],
        bubbles: true
      });
      (touchEvent as any).composedPath = vi.fn().mockReturnValue([document.body]);
      touchEvent.preventDefault = vi.fn();
      touchEvent.stopPropagation = vi.fn();

      component.handleMouseClick(touchEvent);

      expect(touchEvent.stopPropagation).toHaveBeenCalled();
      expect(touchEvent.preventDefault).toHaveBeenCalled();
    });
  });
});
