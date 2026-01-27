// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

const AstroFile = 'data-astro-source-file';
const AstroLocation = 'data-astro-source-loc';

describe('handleMouseMove', () => {
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

  const createElementWithPath = (tagName: string, path: string) => {
    const element = document.createElement(tagName);
    element.setAttribute(PathName, path);
    return element;
  };

  const createAstroElement = (tagName: string, file: string, loc: string) => {
    const element = document.createElement(tagName);
    element.setAttribute(AstroFile, file);
    element.setAttribute(AstroLocation, loc);
    return element;
  };

  const createMouseEvent = (composedPath: EventTarget[]) => {
    const event = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true
    });
    event.composedPath = vi.fn().mockReturnValue(composedPath);
    return event;
  };

  describe('Tracking Conditions', () => {
    it('should render cover when tracking and not dragging', async () => {
      const element = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent([element, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;

      const renderCoverSpy = vi.spyOn(component, 'renderCover').mockImplementation(async () => {});

      await component.handleMouseMove(event);

      expect(renderCoverSpy).toHaveBeenCalledWith(element);
    });

    it('should render cover when open is true', async () => {
      const element = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent([element, document.body]);

      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = true;
      component.hoverSwitch = false;

      const renderCoverSpy = vi.spyOn(component, 'renderCover').mockImplementation(async () => {});

      await component.handleMouseMove(event);

      expect(renderCoverSpy).toHaveBeenCalledWith(element);
    });

    it('should call removeCover when hoverSwitch is true', async () => {
      const element = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent([element, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = true;

      const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      await component.handleMouseMove(event);

      expect(removeCoverSpy).toHaveBeenCalled();
    });

    it('should call removeCover when dragging', async () => {
      const element = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent([element, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = true;
      component.hoverSwitch = false;

      const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      await component.handleMouseMove(event);

      expect(removeCoverSpy).toHaveBeenCalled();
    });

    it('should call removeCover when not tracking and not open', async () => {
      const element = createElementWithPath('div', '/path/file.ts:10:5:div');
      const event = createMouseEvent([element, document.body]);

      component.isTracking = vi.fn().mockReturnValue(false);
      component.open = false;

      const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      await component.handleMouseMove(event);

      expect(removeCoverSpy).toHaveBeenCalled();
    });
  });

  describe('Astro Elements', () => {
    it('should prioritize Astro elements', async () => {
      const astroElement = createAstroElement('div', '/path/astro.astro', '5:3');
      const normalElement = createElementWithPath('span', '/path/file.ts:10:5:span');
      const event = createMouseEvent([normalElement, astroElement, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;

      const renderCoverSpy = vi.spyOn(component, 'renderCover').mockImplementation(async () => {});

      await component.handleMouseMove(event);

      expect(renderCoverSpy).toHaveBeenCalledWith(astroElement);
    });
  });

  describe('Same Position Nodes', () => {
    it('should prefer the outer component when nodes have same position', async () => {
      const innerElement = createElementWithPath('div', '/path/inner.ts:5:1:div');
      const outerElement = createElementWithPath('section', '/path/outer.ts:10:5:section');

      // Make both elements have the same bounding rect
      innerElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100, left: 50, right: 200, bottom: 150
      });
      outerElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 100, left: 50, right: 200, bottom: 150
      });

      const event = createMouseEvent([innerElement, outerElement, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;

      const renderCoverSpy = vi.spyOn(component, 'renderCover').mockImplementation(async () => {});

      await component.handleMouseMove(event);

      // Should prefer the outer element when positions are the same
      expect(renderCoverSpy).toHaveBeenCalledWith(outerElement);
    });
  });

  describe('No Valid Nodes', () => {
    it('should call removeCover when no valid nodes found', async () => {
      const noPathElement = document.createElement('div');
      const event = createMouseEvent([noPathElement, document.body]);

      component.isTracking = vi.fn().mockReturnValue(true);
      component.dragging = false;
      component.hoverSwitch = false;

      const removeCoverSpy = vi.spyOn(component, 'removeCover').mockImplementation(() => {});

      await component.handleMouseMove(event);

      expect(removeCoverSpy).toHaveBeenCalled();
    });
  });
});

describe('isSamePositionNode', () => {
  let component: CodeInspectorComponent;

  beforeEach(async () => {
    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  it('should return true for nodes with same position', () => {
    const node1 = document.createElement('div');
    const node2 = document.createElement('span');

    node1.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100, left: 50, right: 200, bottom: 150
    });
    node2.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100, left: 50, right: 200, bottom: 150
    });

    expect(component.isSamePositionNode(node1, node2)).toBe(true);
  });

  it('should return false for nodes with different positions', () => {
    const node1 = document.createElement('div');
    const node2 = document.createElement('span');

    node1.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100, left: 50, right: 200, bottom: 150
    });
    node2.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 110, left: 50, right: 200, bottom: 160
    });

    expect(component.isSamePositionNode(node1, node2)).toBe(false);
  });
});

describe('getValidNodeList', () => {
  let component: CodeInspectorComponent;

  beforeEach(async () => {
    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  it('should return nodes with PathName attribute', () => {
    const validNode = document.createElement('div');
    validNode.setAttribute(PathName, '/path/file.ts:10:5:div');
    const invalidNode = document.createElement('span');

    const result = component.getValidNodeList([validNode, invalidNode]);

    expect(result.length).toBe(1);
    expect(result[0].node).toBe(validNode);
    expect(result[0].isAstro).toBe(false);
  });

  it('should mark Astro nodes correctly', () => {
    const astroNode = document.createElement('div');
    astroNode.setAttribute(AstroFile, '/path/file.astro');
    astroNode.setAttribute(AstroLocation, '5:3');

    const result = component.getValidNodeList([astroNode]);

    expect(result.length).toBe(1);
    expect(result[0].isAstro).toBe(true);
  });

  it('should return nodes with PathName property', () => {
    const nodeWithProperty = document.createElement('div') as any;
    nodeWithProperty[PathName] = '/path/file.ts:10:5:div';

    const result = component.getValidNodeList([nodeWithProperty]);

    expect(result.length).toBe(1);
    expect(result[0].isAstro).toBe(false);
  });
});
