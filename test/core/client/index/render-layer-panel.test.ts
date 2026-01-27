// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('renderLayerPanel', () => {
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

  const createTreeNode = (name: string = 'div', depth: number = 1) => {
    const element = document.createElement(name);
    element.setAttribute(PathName, `/path/to/file.ts:10:5:${name}`);
    return {
      name,
      path: '/path/to/file.ts',
      line: 10,
      column: 5,
      children: [],
      element,
      depth
    };
  };

  describe('Position Calculation', () => {
    it('should position panel on the left side when x is greater than half viewport width', () => {
      const nodeTree = createTreeNode();
      const x = 800; // Greater than 1024/2 = 512
      const y = 300;

      component.renderLayerPanel(nodeTree, { x, y });

      expect(component.nodeTreePosition.right).toBe('224px'); // 1024 - 800 = 224
      expect(component.nodeTreePosition.left).toBeUndefined();
    });

    it('should position panel on the right side when x is less than half viewport width', () => {
      const nodeTree = createTreeNode();
      const x = 200; // Less than 1024/2 = 512
      const y = 300;

      component.renderLayerPanel(nodeTree, { x, y });

      expect(component.nodeTreePosition.left).toBe('200px');
      expect(component.nodeTreePosition.right).toBeUndefined();
    });

    it('should position panel at top when y is greater than half viewport height', () => {
      const nodeTree = createTreeNode();
      const x = 200;
      const y = 500; // Greater than 768/2 = 384

      component.renderLayerPanel(nodeTree, { x, y });

      expect(component.nodeTreePosition.bottom).toBe('268px'); // 768 - 500 = 268
      expect(component.nodeTreePosition.top).toBeUndefined();
      expect(component.nodeTreePosition.maxHeight).toBe('490px'); // 500 - 10 = 490
    });

    it('should position panel at bottom when y is less than half viewport height', () => {
      const nodeTree = createTreeNode();
      const x = 200;
      const y = 200; // Less than 768/2 = 384

      component.renderLayerPanel(nodeTree, { x, y });

      expect(component.nodeTreePosition.top).toBe('200px');
      expect(component.nodeTreePosition.bottom).toBeUndefined();
      expect(component.nodeTreePosition.maxHeight).toBe('558px'); // 768 - 200 - 10 = 558
    });
  });

  describe('Transform for Overflow', () => {
    it('should add translateX when right position and x is less than PopperWidth (300)', () => {
      const nodeTree = createTreeNode();
      // Need rightToViewPort < x and x < 300
      // With viewport width 1024, if x = 200, rightToViewPort = 824
      // rightToViewPort (824) > x (200), so it uses left positioning

      // Set small viewport so rightToViewPort < x
      Object.defineProperty(document.documentElement, 'clientWidth', {
        value: 400,
        configurable: true
      });

      // x = 250, rightToViewPort = 150
      // rightToViewPort (150) < x (250), uses right positioning
      // x (250) < PopperWidth (300), adds transform
      component.renderLayerPanel(nodeTree, { x: 250, y: 200 });

      expect(component.nodeTreePosition.right).toBe('150px');
      expect(component.nodeTreePosition.transform).toBe('translateX(50px)'); // 300 - 250 = 50
    });

    it('should add translateX when left position and rightToViewPort is less than PopperWidth (300)', () => {
      const nodeTree = createTreeNode();
      // Need rightToViewPort > x and rightToViewPort < 300
      // With viewport width 400, if x = 100, rightToViewPort = 300

      Object.defineProperty(document.documentElement, 'clientWidth', {
        value: 350,
        configurable: true
      });

      // x = 100, rightToViewPort = 250
      // rightToViewPort (250) > x (100), uses left positioning
      // rightToViewPort (250) < PopperWidth (300), adds negative transform
      component.renderLayerPanel(nodeTree, { x: 100, y: 200 });

      expect(component.nodeTreePosition.left).toBe('100px');
      expect(component.nodeTreePosition.transform).toBe('translateX(-50px)'); // -(300 - 250) = -50
    });
  });

  describe('State Changes', () => {
    it('should set nodeTree state', () => {
      const nodeTree = createTreeNode();

      component.renderLayerPanel(nodeTree, { x: 200, y: 200 });

      expect(component.nodeTree).toBe(nodeTree);
    });

    it('should set showNodeTree to true', () => {
      const nodeTree = createTreeNode();
      component.showNodeTree = false;

      component.renderLayerPanel(nodeTree, { x: 200, y: 200 });

      expect(component.showNodeTree).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle coordinates at viewport edge', () => {
      const nodeTree = createTreeNode();

      component.renderLayerPanel(nodeTree, { x: 0, y: 0 });

      expect(component.nodeTreePosition.left).toBe('0px');
      expect(component.nodeTreePosition.top).toBe('0px');
    });

    it('should handle coordinates at max viewport', () => {
      const nodeTree = createTreeNode();

      component.renderLayerPanel(nodeTree, { x: 1024, y: 768 });

      expect(component.nodeTreePosition.right).toBe('0px');
      expect(component.nodeTreePosition.bottom).toBe('0px');
    });
  });
});
