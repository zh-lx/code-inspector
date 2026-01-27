// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('handleClickTreeNode', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  const createTreeNode = (name: string = 'div') => {
    const element = document.createElement(name);
    element.setAttribute(PathName, `/path/to/file.ts:10:5:${name}`);
    return {
      name,
      path: '/path/to/file.ts',
      line: 10,
      column: 5,
      children: [],
      element,
      depth: 1
    };
  };

  describe('Element Setting', () => {
    it('should set element state to clicked node', () => {
      const node = createTreeNode('div');

      component.handleClickTreeNode(node);

      expect(component.element.name).toBe('div');
      expect(component.element.path).toBe('/path/to/file.ts');
      expect(component.element.line).toBe(10);
      expect(component.element.column).toBe(5);
    });

    it('should update element state when clicking different node', () => {
      const node1 = createTreeNode('div');
      const node2 = {
        name: 'span',
        path: '/other/path.ts',
        line: 20,
        column: 10,
        children: [],
        element: document.createElement('span'),
        depth: 2
      };

      component.handleClickTreeNode(node1);
      expect(component.element.name).toBe('div');

      component.handleClickTreeNode(node2);
      expect(component.element.name).toBe('span');
      expect(component.element.path).toBe('/other/path.ts');
      expect(component.element.line).toBe(20);
      expect(component.element.column).toBe(10);
    });
  });

  describe('Track Code', () => {
    it('should call trackCode after setting element', () => {
      const node = createTreeNode('div');
      const trackCodeSpy = vi.spyOn(component, 'trackCode');

      component.handleClickTreeNode(node);

      expect(trackCodeSpy).toHaveBeenCalled();
    });
  });

  describe('Layer Panel Removal', () => {
    it('should call removeLayerPanel after clicking node', () => {
      const node = createTreeNode('div');
      const removeLayerPanelSpy = vi.spyOn(component, 'removeLayerPanel');

      component.handleClickTreeNode(node);

      expect(removeLayerPanelSpy).toHaveBeenCalled();
    });

    it('should reset nodeTree and showNodeTree after clicking', () => {
      const node = createTreeNode('div');
      component.nodeTree = node;
      component.showNodeTree = true;

      component.handleClickTreeNode(node);

      expect(component.nodeTree).toBeNull();
      expect(component.showNodeTree).toBe(false);
    });
  });

  describe('Execution Order', () => {
    it('should execute in correct order: set element, trackCode, removeLayerPanel', () => {
      const node = createTreeNode('div');
      const callOrder: string[] = [];

      const originalTrackCode = component.trackCode;
      component.trackCode = vi.fn(() => {
        callOrder.push('trackCode');
        // Verify element is set before trackCode
        expect(component.element.name).toBe('div');
      });

      const originalRemoveLayerPanel = component.removeLayerPanel;
      component.removeLayerPanel = vi.fn(() => {
        callOrder.push('removeLayerPanel');
      });

      component.handleClickTreeNode(node);

      expect(callOrder).toEqual(['trackCode', 'removeLayerPanel']);
    });
  });
});
