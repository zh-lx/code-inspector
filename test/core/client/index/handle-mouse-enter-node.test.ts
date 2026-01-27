// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('handleMouseEnterNode', () => {
  let component: CodeInspectorComponent;

  beforeEach(async () => {
    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);

    // Wait for component to be ready
    await component.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  const createTreeNode = (name: string = 'div') => {
    const element = document.createElement(name);
    element.setAttribute(PathName, `/path/to/file.ts:10:5:${name}`);
    document.body.appendChild(element);
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

  const createMockMouseEvent = (x: number, y: number, width: number, height: number) => {
    const target = document.createElement('div');
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      x,
      y,
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height
    });

    return {
      target,
      type: 'mouseenter'
    } as unknown as MouseEvent;
  };

  describe('Active Node State', () => {
    it('should set activeNode with correct properties', async () => {
      const node = createTreeNode('div');
      const event = createMockMouseEvent(100, 200, 150, 30);

      // Need to set up showNodeTree for the tooltip to work
      component.showNodeTree = true;
      await component.updateComplete;

      await component.handleMouseEnterNode(event, node);

      expect(component.activeNode.width).toBe('134px'); // 150 - 16
      expect(component.activeNode.left).toBe('108px'); // 100 + 8
      expect(component.activeNode.content).toBe('/path/to/file.ts:10:5');
    });

    it('should set initial visibility to hidden then visible', async () => {
      const node = createTreeNode('div');
      const event = createMockMouseEvent(100, 200, 150, 30);

      component.showNodeTree = true;
      await component.updateComplete;

      await component.handleMouseEnterNode(event, node);

      // After nextTick, it should become visible
      expect(component.activeNode.visibility).toBe('visible');
    });

    it('should set top position correctly', async () => {
      const node = createTreeNode('div');
      const event = createMockMouseEvent(100, 200, 150, 30);

      component.showNodeTree = true;
      await component.updateComplete;

      await component.handleMouseEnterNode(event, node);

      expect(component.activeNode.top).toBe('196px'); // 200 - 4
    });

    it('should set tooltip class to tooltip-top initially', async () => {
      const node = createTreeNode('div');
      const event = createMockMouseEvent(100, 200, 150, 30);

      component.showNodeTree = true;
      await component.updateComplete;

      await component.handleMouseEnterNode(event, node);

      // If tooltip y position is valid (>= 0), class should be tooltip-top
      expect(component.activeNode.class).toBe('tooltip-top');
    });

    it('should change tooltip position to bottom when tooltip Y is negative', async () => {
      const node = createTreeNode('div');
      // Position near top of viewport where tooltip would go above screen
      const event = createMockMouseEvent(100, 10, 150, 30);

      component.showNodeTree = true;
      await component.updateComplete;

      // Mock nodeTreeTooltipRef to return negative Y
      const mockTooltipRef = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          y: -50, // Negative Y - tooltip is off screen
          x: 0,
          width: 100,
          height: 20
        })
      };
      Object.defineProperty(component, 'nodeTreeTooltipRef', {
        value: mockTooltipRef,
        writable: true
      });

      await component.handleMouseEnterNode(event, node);

      // Should switch to tooltip-bottom when Y is negative
      expect(component.activeNode.class).toBe('tooltip-bottom');
      // Top should be y + height + 4 = 10 + 30 + 4 = 44px
      expect(component.activeNode.top).toBe('44px');
    });
  });

  describe('Render Cover', () => {
    it('should call renderCover with node element', async () => {
      const node = createTreeNode('div');
      const event = createMockMouseEvent(100, 200, 150, 30);

      const renderCoverSpy = vi.spyOn(component, 'renderCover');

      await component.handleMouseEnterNode(event, node);

      expect(renderCoverSpy).toHaveBeenCalledWith(node.element);
    });
  });

  describe('Content Formatting', () => {
    it('should format content with path:line:column', async () => {
      const node = {
        name: 'span',
        path: '/custom/path.tsx',
        line: 42,
        column: 15,
        children: [],
        element: document.createElement('span'),
        depth: 2
      };
      node.element.setAttribute(PathName, '/custom/path.tsx:42:15:span');
      const event = createMockMouseEvent(50, 100, 200, 25);

      await component.handleMouseEnterNode(event, node);

      expect(component.activeNode.content).toBe('/custom/path.tsx:42:15');
    });
  });
});
