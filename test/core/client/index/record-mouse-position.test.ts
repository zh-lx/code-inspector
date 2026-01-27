// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('recordMousePosition', () => {
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

  describe('Mouse Events', () => {
    it('should record position for switch target with mouse event', async () => {
      // Wait for refs to be ready
      await component.updateComplete;
      component.showSwitch = true;
      await component.updateComplete;

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        bubbles: true
      });
      Object.defineProperty(mouseEvent, 'pageX', { value: 100 });
      Object.defineProperty(mouseEvent, 'pageY', { value: 200 });
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent, 'switch');

      expect(component.dragging).toBe(true);
      expect(component.draggingTarget).toBe('switch');
      expect(mouseEvent.preventDefault).toHaveBeenCalled();
    });

    it('should record position for nodeTree target with mouse event', async () => {
      await component.updateComplete;
      component.showNodeTree = true;
      await component.updateComplete;

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 150,
        clientY: 250,
        bubbles: true
      });
      Object.defineProperty(mouseEvent, 'pageX', { value: 150 });
      Object.defineProperty(mouseEvent, 'pageY', { value: 250 });
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent, 'nodeTree');

      expect(component.dragging).toBe(true);
      expect(component.draggingTarget).toBe('nodeTree');
    });
  });

  describe('Touch Events', () => {
    it('should record position with touch event', async () => {
      await component.updateComplete;
      component.showSwitch = true;
      await component.updateComplete;

      const touch = {
        pageX: 100,
        pageY: 200,
        clientX: 100,
        clientY: 200,
        identifier: 0,
        target: document.body
      };
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch as Touch],
        bubbles: true
      });
      touchEvent.preventDefault = vi.fn();

      component.recordMousePosition(touchEvent, 'switch');

      expect(component.dragging).toBe(true);
      expect(component.draggingTarget).toBe('switch');
    });
  });

  describe('Mouse Position Calculation', () => {
    it('should set mousePosition with correct values', async () => {
      await component.updateComplete;
      component.showSwitch = true;
      await component.updateComplete;

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 200,
        bubbles: true
      });
      Object.defineProperty(mouseEvent, 'pageX', { value: 300 });
      Object.defineProperty(mouseEvent, 'pageY', { value: 400 });
      mouseEvent.preventDefault = vi.fn();

      component.recordMousePosition(mouseEvent, 'switch');

      expect(component.mousePosition.moveX).toBe(300);
      expect(component.mousePosition.moveY).toBe(400);
    });
  });
});
