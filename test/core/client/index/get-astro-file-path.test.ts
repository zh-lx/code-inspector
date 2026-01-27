// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

const AstroFile = 'data-astro-source-file';
const AstroLocation = 'data-astro-source-loc';

describe('getAstroFilePath', () => {
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

  it('should return empty string when element has no Astro attributes', () => {
    const element = document.createElement('div');

    const result = component.getAstroFilePath(element);

    expect(result).toBe('');
  });

  it('should return formatted path when element has Astro attributes', () => {
    const element = document.createElement('div');
    element.setAttribute(AstroFile, '/path/to/component.astro');
    element.setAttribute(AstroLocation, '10:5');

    const result = component.getAstroFilePath(element);

    expect(result).toBe('/path/to/component.astro:10:5:div');
  });

  it('should use lowercase tagName', () => {
    const element = document.createElement('DIV');
    element.setAttribute(AstroFile, '/path/file.astro');
    element.setAttribute(AstroLocation, '1:1');

    const result = component.getAstroFilePath(element);

    expect(result).toBe('/path/file.astro:1:1:div');
  });

  it('should handle custom elements', () => {
    const element = document.createElement('my-custom-element');
    element.setAttribute(AstroFile, '/path/component.astro');
    element.setAttribute(AstroLocation, '5:3');

    const result = component.getAstroFilePath(element);

    expect(result).toBe('/path/component.astro:5:3:my-custom-element');
  });
});

describe('removeCover with nodeTree', () => {
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

  it('should not remove cover when nodeTree exists and force is not true', () => {
    component.show = true;
    component.targetNode = document.createElement('div');
    component.nodeTree = {
      name: 'div',
      path: '/path/file.ts',
      line: 10,
      column: 5,
      children: [],
      element: document.createElement('div'),
      depth: 1
    };

    component.removeCover();

    // show should still be true because nodeTree exists
    expect(component.show).toBe(true);
  });

  it('should remove cover when nodeTree exists but force is true', () => {
    component.show = true;
    component.targetNode = document.createElement('div');
    component.nodeTree = {
      name: 'div',
      path: '/path/file.ts',
      line: 10,
      column: 5,
      children: [],
      element: document.createElement('div'),
      depth: 1
    };

    component.removeCover(true);

    expect(component.show).toBe(false);
  });

  it('should remove cover when nodeTree is null', () => {
    component.show = true;
    component.targetNode = document.createElement('div');
    component.nodeTree = null;

    component.removeCover();

    expect(component.show).toBe(false);
  });

  it('should not remove cover when force is MouseEvent and nodeTree exists', () => {
    component.show = true;
    component.targetNode = document.createElement('div');
    component.nodeTree = {
      name: 'div',
      path: '/path/file.ts',
      line: 10,
      column: 5,
      children: [],
      element: document.createElement('div'),
      depth: 1
    };

    const mouseEvent = new MouseEvent('mouseleave');
    component.removeCover(mouseEvent);

    // MouseEvent is not === true, so should not remove when nodeTree exists
    expect(component.show).toBe(true);
  });
});
