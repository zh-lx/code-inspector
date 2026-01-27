// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('generateNodeTree', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
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

  describe('Basic Functionality', () => {
    it('should generate tree from single element', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const nodePath = [div];

      const result = component.generateNodeTree(nodePath);

      expect(result).toBeDefined();
      expect(result.name).toBe('div');
      expect(result.path).toBe('/path/file.ts');
      expect(result.line).toBe(10);
      expect(result.column).toBe(5);
      expect(result.depth).toBe(1);
      expect(result.children).toEqual([]);
    });

    it('should generate tree from multiple elements', () => {
      const parent = createElementWithPath('section', '/path/file.ts:5:1:section');
      const child = createElementWithPath('div', '/path/file.ts:10:5:div');
      // Note: nodePath order is innermost first, so we need to reverse
      const nodePath = [child, parent];

      const result = component.generateNodeTree(nodePath);

      expect(result).toBeDefined();
      // After reversing, parent is first (root), child is second (nested)
      expect(result.name).toBe('section');
      expect(result.depth).toBe(1);
      expect(result.children.length).toBe(1);
      expect(result.children[0].name).toBe('div');
      expect(result.children[0].depth).toBe(2);
    });

    it('should generate deeply nested tree', () => {
      const root = createElementWithPath('main', '/path/file.ts:1:1:main');
      const middle = createElementWithPath('section', '/path/file.ts:5:3:section');
      const leaf = createElementWithPath('div', '/path/file.ts:10:5:div');
      const nodePath = [leaf, middle, root];

      const result = component.generateNodeTree(nodePath);

      expect(result.name).toBe('main');
      expect(result.depth).toBe(1);
      expect(result.children[0].name).toBe('section');
      expect(result.children[0].depth).toBe(2);
      expect(result.children[0].children[0].name).toBe('div');
      expect(result.children[0].children[0].depth).toBe(3);
    });
  });

  describe('Filtering', () => {
    it('should skip elements without path attribute', () => {
      const withPath = createElementWithPath('div', '/path/file.ts:10:5:div');
      const withoutPath = document.createElement('span');
      const nodePath = [withPath, withoutPath];

      const result = component.generateNodeTree(nodePath);

      expect(result.name).toBe('div');
      expect(result.children).toEqual([]);
    });

    it('should handle mixed elements with and without paths', () => {
      const root = createElementWithPath('main', '/path/file.ts:1:1:main');
      const noPath1 = document.createElement('div');
      const middle = createElementWithPath('section', '/path/file.ts:5:3:section');
      const noPath2 = document.createElement('span');
      const leaf = createElementWithPath('p', '/path/file.ts:10:5:p');
      const nodePath = [leaf, noPath2, middle, noPath1, root];

      const result = component.generateNodeTree(nodePath);

      expect(result.name).toBe('main');
      expect(result.children[0].name).toBe('section');
      expect(result.children[0].children[0].name).toBe('p');
    });
  });

  describe('Element Reference', () => {
    it('should include element reference in tree node', () => {
      const div = createElementWithPath('div', '/path/file.ts:10:5:div');
      const nodePath = [div];

      const result = component.generateNodeTree(nodePath);

      expect(result.element).toBe(div);
    });
  });

  describe('Path Parsing', () => {
    it('should correctly parse path with colons in file path', () => {
      const div = createElementWithPath('div', 'C:/Users/path/file.ts:10:5:div');
      const nodePath = [div];

      const result = component.generateNodeTree(nodePath);

      expect(result.path).toBe('C:/Users/path/file.ts');
      expect(result.line).toBe(10);
      expect(result.column).toBe(5);
      expect(result.name).toBe('div');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty node path', () => {
      const nodePath: HTMLElement[] = [];

      const result = component.generateNodeTree(nodePath);

      expect(result).toBeUndefined();
    });

    it('should handle node path with all non-path elements', () => {
      const noPath1 = document.createElement('div');
      const noPath2 = document.createElement('span');
      const nodePath = [noPath1, noPath2];

      const result = component.generateNodeTree(nodePath);

      expect(result).toBeUndefined();
    });
  });
});
