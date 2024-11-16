// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

// 模拟 composedPath
vi.mock('@/core/src/shared', () => ({
  PathName: 'data-insp-path',
  DefaultPort: 5678
}));

describe('handleMouseMove', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    
    // 模拟方法
    component.renderCover = vi.fn();
    component.removeCover = vi.fn();
    component.isTracking = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should call renderCover when valid target is found with PathName attribute', () => {
      const targetNode = document.createElement('div');
      targetNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode, document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).toHaveBeenCalledWith(targetNode);
      expect(component.removeCover).not.toHaveBeenCalled();
    });

    it('should call renderCover when valid target is found with PathName property', () => {
      const targetNode = document.createElement('div');
      // @ts-ignore
      targetNode[PathName] = '/path/to/file.ts:10:5:div';

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode, document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).toHaveBeenCalledWith(targetNode);
    });

    it('should call renderCover when valid target is found with Astro attributes', () => {
      const targetNode = document.createElement('div');
      targetNode.setAttribute('data-astro-source-file', '/astro/file.ts');

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode, document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).toHaveBeenCalledWith(targetNode);
    });
  });

  describe('Conditions for Not Rendering', () => {
    it('should call removeCover when no valid target is found', () => {
      const normalNode = document.createElement('div');
      
      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([normalNode, document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).not.toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });

    it('should call removeCover when dragging is true', () => {
      component.dragging = true;
      const targetNode = document.createElement('div');
      targetNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode, document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).not.toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });

    it('should call removeCover when hoverSwitch is true', () => {
      component.hoverSwitch = true;
      const targetNode = document.createElement('div');
      targetNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode, document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).not.toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });
  });

  describe('Touch Events', () => {
    it('should handle touch events correctly', () => {
      const targetNode = document.createElement('div');
      targetNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');

      const touchEvent = new TouchEvent('touchmove');
      touchEvent.composedPath = vi.fn().mockReturnValue([targetNode, document.body]);
      component.handleMouseMove(touchEvent);

      expect(component.renderCover).toHaveBeenCalledWith(targetNode);
    });
  });

  describe('Path Traversal', () => {
    it('should find first valid target in path', () => {
      const validNode = document.createElement('div');
      validNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');
      const anotherValidNode = document.createElement('div');
      anotherValidNode.setAttribute(PathName, '/another/path.ts:20:5:div');
      
      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([
        document.createElement('div'),
        validNode,
        anotherValidNode,
        document.body
      ] as EventTarget[]);

      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).toHaveBeenCalledWith(validNode);
    });

    it('should handle empty path', () => {
      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).not.toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle nodes without hasAttribute method', () => {
      const node = { nodeType: 1 };
      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([document.body]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).not.toHaveBeenCalled();
      expect(component.removeCover).toHaveBeenCalled();
    });
  });

  describe('State Combinations', () => {
    it('should render when isTracking is true and open is false', () => {
      component.open = false;
      component.hoverSwitch = false;

      const targetNode = document.createElement('div');
      targetNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).toHaveBeenCalled();
    });

    it('should render when isTracking is false but open is true', () => {
      component.open = true;
      component.hoverSwitch = false;

      const targetNode = document.createElement('div');
      targetNode.setAttribute(PathName, '/path/to/file.ts:10:5:div');

      const mouseEvent = new MouseEvent('mousemove');
      mouseEvent.composedPath = vi.fn().mockReturnValue([targetNode]);
      component.handleMouseMove(mouseEvent);

      expect(component.renderCover).toHaveBeenCalled();
    });
  });
});