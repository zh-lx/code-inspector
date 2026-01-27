// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('handleContextMenu', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);

    // Mock viewport dimensions
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1024,
      configurable: true
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 768,
      configurable: true
    });
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  const createElementWithPath = (tagName: string, path: string) => {
    const element = document.createElement(tagName);
    element.setAttribute(PathName, path);
    return element;
  };

  const createMouseEvent = (clientX: number, clientY: number, composedPath: EventTarget[]) => {
    const event = new MouseEvent('contextmenu', {
      clientX,
      clientY,
      bubbles: true,
      cancelable: true
    });
    event.composedPath = vi.fn().mockReturnValue(composedPath);
    event.preventDefault = vi.fn();
    return event;
  };

  describe('Trigger Conditions', () => {
    it('should render layer panel when isTracking returns true', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(200, 200, [div, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;
      component.open = false;

      component.handleContextMenu(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.showNodeTree).toBe(true);
    });

    it('should render layer panel when open is true', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(200, 200, [div, document.body]);

      component.isTracking = vi.fn().mockReturnValue(false);
      component.dragging = false;
      component.hoverSwitch = false;
      component.open = true;

      component.handleContextMenu(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.showNodeTree).toBe(true);
    });

    it('should not render layer panel when dragging', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(200, 200, [div, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = true;
      component.hoverSwitch = false;

      component.handleContextMenu(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.showNodeTree).toBe(false);
    });

    it('should not render layer panel when hoverSwitch is true', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(200, 200, [div, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = true;

      component.handleContextMenu(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.showNodeTree).toBe(false);
    });

    it('should not render layer panel when isTracking is false and open is false', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(200, 200, [div, document.body]);

      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = false;

      component.handleContextMenu(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.showNodeTree).toBe(false);
    });
  });

  describe('Node Tree Generation', () => {
    it('should generate node tree from event composedPath', () => {
      const parent = createElementWithPath('section', '/path/file.ts:5:1:section');
      const child = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(200, 200, [child, parent, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;

      component.handleContextMenu(event);

      expect(component.nodeTree).toBeDefined();
      expect(component.nodeTree!.name).toBe('section');
    });
  });

  describe('Position Passing', () => {
    it('should pass clientX and clientY to renderLayerPanel', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent(300, 400, [div, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;

      const renderLayerPanelSpy = vi.spyOn(component, 'renderLayerPanel');

      component.handleContextMenu(event);

      expect(renderLayerPanelSpy).toHaveBeenCalledWith(
        expect.any(Object),
        { x: 300, y: 400 }
      );
    });
  });
});
