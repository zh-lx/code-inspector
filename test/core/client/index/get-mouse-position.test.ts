// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('getMousePosition', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
  });

  describe('Mouse Events', () => {
    it('should return correct position for mouse event', () => {
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', {
        value: 100,
        writable: true
      });
      Object.defineProperty(mouseEvent, 'pageY', {
        value: 200,
        writable: true
      });

      const position = component.getMousePosition(mouseEvent);

      expect(position).toEqual({
        x: 100,
        y: 200
      });
    });

    it('should handle zero coordinates', () => {
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', {
        value: 0,
        writable: true
      });
      Object.defineProperty(mouseEvent, 'pageY', {
        value: 0,
        writable: true
      });

      const position = component.getMousePosition(mouseEvent);

      expect(position).toEqual({
        x: 0,
        y: 0
      });
    });

    it('should handle negative coordinates', () => {
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', {
        value: -10,
        writable: true
      });
      Object.defineProperty(mouseEvent, 'pageY', {
        value: -20,
        writable: true
      });

      const position = component.getMousePosition(mouseEvent);

      expect(position).toEqual({
        x: -10,
        y: -20
      });
    });
  });

  describe('Touch Events', () => {
    it('should return correct position for touch event with one touch', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ pageX: 150, pageY: 250 }] as unknown as Touch[]
      });

      const position = component.getMousePosition(touchEvent);

      expect(position).toEqual({
        x: 150,
        y: 250
      });
    });

    it('should handle touch event with no touches', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [] as unknown as Touch[]
      });

      const position = component.getMousePosition(touchEvent);

      expect(position).toEqual({
        x: undefined,
        y: undefined
      });
    });

    it('should handle touch event with multiple touches', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [
          { pageX: 100, pageY: 200 },
          { pageX: 300, pageY: 400 }
        ] as unknown as Touch[]
      });

      const position = component.getMousePosition(touchEvent);

      // 应该只使用第一个触摸点的位置
      expect(position).toEqual({
        x: 100,
        y: 200
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle touch event with undefined coordinates', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ pageX: undefined, pageY: undefined }] as unknown as Touch[]
      });

      const position = component.getMousePosition(touchEvent);

      expect(position).toEqual({
        x: undefined,
        y: undefined
      });
    });

    it('should handle touch event with partial coordinates', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ pageX: 100 }] as unknown as Touch[]
      });

      const position = component.getMousePosition(touchEvent);

      expect(position).toEqual({
        x: 100,
        y: undefined
      });
    });

    it('should handle large coordinate values', () => {
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', {
        value: 999999,
        writable: true
      });
      Object.defineProperty(mouseEvent, 'pageY', {
        value: 999999,
        writable: true
      });

      const position = component.getMousePosition(mouseEvent);

      expect(position).toEqual({
        x: 999999,
        y: 999999
      });
    });
  });

  describe('Type Checking', () => {
    it('should correctly identify MouseEvent', () => {
      const mouseEvent = new MouseEvent('mousemove');
      Object.defineProperty(mouseEvent, 'pageX', {
        value: 100,
        writable: true
      });
      Object.defineProperty(mouseEvent, 'pageY', {
        value: 200,
        writable: true
      });

      const position = component.getMousePosition(mouseEvent);

      expect(position.x).toBe(mouseEvent.pageX);
      expect(position.y).toBe(mouseEvent.pageY);
    });

    it('should correctly identify TouchEvent', () => {
      const touchEvent = new TouchEvent('touchmove', {
        touches: [{ pageX: 150, pageY: 250 }] as unknown as Touch[]
      });

      const position = component.getMousePosition(touchEvent);

      expect(position.x).toBe(touchEvent.touches[0].pageX);
      expect(position.y).toBe(touchEvent.touches[0].pageY);
    });
  });
});