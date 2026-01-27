// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('handleMouseLeaveNode', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Active Node State', () => {
    it('should set activeNode visibility to hidden', () => {
      component.activeNode = {
        visibility: 'visible',
        top: '100px',
        left: '50px',
        width: '200px',
        content: 'test content',
        class: 'tooltip-top'
      };

      component.handleMouseLeaveNode();

      expect(component.activeNode.visibility).toBe('hidden');
    });

    it('should preserve other activeNode properties', () => {
      component.activeNode = {
        visibility: 'visible',
        top: '100px',
        left: '50px',
        width: '200px',
        content: 'test content',
        class: 'tooltip-top'
      };

      component.handleMouseLeaveNode();

      expect(component.activeNode.top).toBe('100px');
      expect(component.activeNode.left).toBe('50px');
      expect(component.activeNode.width).toBe('200px');
      expect(component.activeNode.content).toBe('test content');
      expect(component.activeNode.class).toBe('tooltip-top');
    });
  });

  describe('Remove Cover', () => {
    it('should call removeCover with true argument', () => {
      const removeCoverSpy = vi.spyOn(component, 'removeCover');

      component.handleMouseLeaveNode();

      expect(removeCoverSpy).toHaveBeenCalledWith(true);
    });

    it('should force remove cover regardless of nodeTree state', () => {
      // Set nodeTree to a value (which would normally prevent removeCover)
      component.nodeTree = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [],
        element: document.createElement('div'),
        depth: 1
      };

      const removeCoverSpy = vi.spyOn(component, 'removeCover');

      component.handleMouseLeaveNode();

      // Should still call removeCover with true to force removal
      expect(removeCoverSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple consecutive calls', () => {
      component.activeNode = {
        visibility: 'visible',
        top: '100px',
        left: '50px'
      };

      component.handleMouseLeaveNode();
      expect(component.activeNode.visibility).toBe('hidden');

      component.handleMouseLeaveNode();
      expect(component.activeNode.visibility).toBe('hidden');

      component.handleMouseLeaveNode();
      expect(component.activeNode.visibility).toBe('hidden');
    });
  });

  describe('Empty State', () => {
    it('should handle empty activeNode', () => {
      component.activeNode = {};

      expect(() => {
        component.handleMouseLeaveNode();
      }).not.toThrow();

      expect(component.activeNode.visibility).toBe('hidden');
    });
  });
});
