// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('render', () => {
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

  describe('Container Visibility', () => {
    it('should hide container when show is false', async () => {
      component.show = false;
      await component.updateComplete;

      const container = component.shadowRoot?.querySelector('.code-inspector-container') as HTMLElement;
      expect(container?.style.display).toBe('none');
    });

    it('should show container when show is true', async () => {
      component.show = true;
      await component.updateComplete;

      const container = component.shadowRoot?.querySelector('.code-inspector-container') as HTMLElement;
      expect(container?.style.display).toBe('block');
    });
  });

  describe('Position Styles', () => {
    it('should apply position styles from state', async () => {
      component.show = true;
      component.position = {
        top: 100,
        left: 50,
        bottom: 200,
        right: 250,
        margin: { top: 5, right: 10, bottom: 5, left: 10 },
        border: { top: 1, right: 1, bottom: 1, left: 1 },
        padding: { top: 2, right: 2, bottom: 2, left: 2 }
      };
      await component.updateComplete;

      const container = component.shadowRoot?.querySelector('.code-inspector-container') as HTMLElement;
      expect(container?.style.top).toBe('95px'); // 100 - 5
      expect(container?.style.left).toBe('40px'); // 50 - 10
    });
  });

  describe('Inspector Switch', () => {
    it('should hide switch when showSwitch is false', async () => {
      component.showSwitch = false;
      await component.updateComplete;

      const switchEl = component.shadowRoot?.querySelector('#inspector-switch') as HTMLElement;
      expect(switchEl?.style.display).toBe('none');
    });

    it('should show switch when showSwitch is true', async () => {
      component.showSwitch = true;
      await component.updateComplete;

      const switchEl = component.shadowRoot?.querySelector('#inspector-switch') as HTMLElement;
      expect(switchEl?.style.display).toBe('flex');
    });

    it('should add active class when open is true', async () => {
      component.showSwitch = true;
      component.open = true;
      await component.updateComplete;

      const switchEl = component.shadowRoot?.querySelector('#inspector-switch');
      expect(switchEl?.classList.contains('active-inspector-switch')).toBe(true);
    });

    it('should add move class when moved is true', async () => {
      component.showSwitch = true;
      component.moved = true;
      await component.updateComplete;

      const switchEl = component.shadowRoot?.querySelector('#inspector-switch');
      expect(switchEl?.classList.contains('move-inspector-switch')).toBe(true);
    });

    it('should trigger recordMousePosition on mousedown', async () => {
      component.showSwitch = true;
      await component.updateComplete;

      const recordMousePositionSpy = vi.spyOn(component, 'recordMousePosition');

      const switchEl = component.shadowRoot?.querySelector('#inspector-switch') as HTMLElement;
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 200 });
      Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
      Object.defineProperty(mouseDownEvent, 'pageY', { value: 200 });
      switchEl?.dispatchEvent(mouseDownEvent);

      expect(recordMousePositionSpy).toHaveBeenCalled();
    });

    it('should trigger recordMousePosition on touchstart', async () => {
      component.showSwitch = true;
      await component.updateComplete;

      const recordMousePositionSpy = vi.spyOn(component, 'recordMousePosition');

      const switchEl = component.shadowRoot?.querySelector('#inspector-switch') as HTMLElement;
      const touch = {
        pageX: 100,
        pageY: 200,
        clientX: 100,
        clientY: 200,
        identifier: 0,
        target: switchEl
      };
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [touch as Touch],
        bubbles: true
      });
      switchEl?.dispatchEvent(touchStartEvent);

      expect(recordMousePositionSpy).toHaveBeenCalled();
    });
  });

  describe('Node Tree Panel', () => {
    it('should hide node tree when showNodeTree is false', async () => {
      component.showNodeTree = false;
      await component.updateComplete;

      const nodeTree = component.shadowRoot?.querySelector('#inspector-node-tree') as HTMLElement;
      expect(nodeTree?.style.display).toBe('none');
    });

    it('should show node tree when showNodeTree is true', async () => {
      component.showNodeTree = true;
      await component.updateComplete;

      const nodeTree = component.shadowRoot?.querySelector('#inspector-node-tree') as HTMLElement;
      expect(nodeTree?.style.display).toBe('flex');
    });

    it('should apply nodeTreePosition styles', async () => {
      component.showNodeTree = true;
      component.nodeTreePosition = {
        left: '100px',
        top: '200px',
        maxHeight: '300px'
      };
      await component.updateComplete;

      const nodeTree = component.shadowRoot?.querySelector('#inspector-node-tree') as HTMLElement;
      expect(nodeTree?.style.left).toBe('100px');
      expect(nodeTree?.style.top).toBe('200px');
      expect(nodeTree?.style.maxHeight).toBe('300px');
    });

    it('should trigger recordMousePosition on title mousedown', async () => {
      component.showNodeTree = true;
      await component.updateComplete;

      const recordMousePositionSpy = vi.spyOn(component, 'recordMousePosition');

      const titleEl = component.shadowRoot?.querySelector('.inspector-layer-title') as HTMLElement;
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, clientX: 100, clientY: 200 });
      Object.defineProperty(mouseDownEvent, 'pageX', { value: 100 });
      Object.defineProperty(mouseDownEvent, 'pageY', { value: 200 });
      titleEl?.dispatchEvent(mouseDownEvent);

      expect(recordMousePositionSpy).toHaveBeenCalledWith(expect.any(MouseEvent), 'nodeTree');
    });

    it('should trigger recordMousePosition on title touchstart', async () => {
      component.showNodeTree = true;
      await component.updateComplete;

      const recordMousePositionSpy = vi.spyOn(component, 'recordMousePosition');

      const titleEl = component.shadowRoot?.querySelector('.inspector-layer-title') as HTMLElement;
      const touch = {
        pageX: 100,
        pageY: 200,
        clientX: 100,
        clientY: 200,
        identifier: 0,
        target: titleEl
      };
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [touch as Touch],
        bubbles: true
      });
      titleEl?.dispatchEvent(touchStartEvent);

      expect(recordMousePositionSpy).toHaveBeenCalledWith(expect.any(TouchEvent), 'nodeTree');
    });

    it('should close node tree when close icon is clicked', async () => {
      component.showNodeTree = true;
      component.nodeTree = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [],
        element: document.createElement('div'),
        depth: 1
      };
      await component.updateComplete;

      const closeIcon = component.shadowRoot?.querySelector('.close-icon') as SVGElement;
      const clickEvent = new MouseEvent('click', { bubbles: true });
      closeIcon?.dispatchEvent(clickEvent);

      // removeLayerPanel sets showNodeTree to false
      expect(component.showNodeTree).toBe(false);
    });
  });

  describe('Settings Modal', () => {
    it('should not render settings modal when showSettingsModal is false', async () => {
      component.showSettingsModal = false;
      await component.updateComplete;

      const modal = component.shadowRoot?.querySelector('.settings-modal-overlay');
      expect(modal).toBeNull();
    });

    it('should render settings modal when showSettingsModal is true', async () => {
      component.showSettingsModal = true;
      await component.updateComplete;

      const modal = component.shadowRoot?.querySelector('.settings-modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should render feature toggles in settings modal', async () => {
      component.showSettingsModal = true;
      await component.updateComplete;

      const switches = component.shadowRoot?.querySelectorAll('.settings-switch');
      expect(switches?.length).toBe(3);
    });

    it('should close modal when clicking overlay', async () => {
      component.showSettingsModal = true;
      await component.updateComplete;

      const overlay = component.shadowRoot?.querySelector('.settings-modal-overlay') as HTMLElement;
      overlay?.click();
      await component.updateComplete;

      expect(component.showSettingsModal).toBe(false);
    });

    it('should close modal when clicking close button', async () => {
      component.showSettingsModal = true;
      await component.updateComplete;

      const closeBtn = component.shadowRoot?.querySelector('.settings-modal-close') as HTMLElement;
      closeBtn?.click();
      await component.updateComplete;

      expect(component.showSettingsModal).toBe(false);
    });

    it('should not close modal when clicking modal content', async () => {
      component.showSettingsModal = true;
      await component.updateComplete;

      const modal = component.shadowRoot?.querySelector('.settings-modal') as HTMLElement;
      modal?.click();
      await component.updateComplete;

      expect(component.showSettingsModal).toBe(true);
    });
    it('should toggle feature when checkbox is changed', async () => {
      component.showSettingsModal = true;
      component.internalLocate = true;
      await component.updateComplete;

      const checkbox = component.shadowRoot?.querySelector('.settings-switch input') as HTMLInputElement;

      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      checkbox?.dispatchEvent(changeEvent);
      await component.updateComplete;

      // The first feature is Locate, so internalLocate should toggle
      expect(component.internalLocate).toBe(false);
    });
  });

  describe('Element Info', () => {
    it('should render element name', async () => {
      component.show = true;
      component.element = {
        name: 'TestComponent',
        path: '/path/to/file.tsx',
        line: 42,
        column: 10
      };
      await component.updateComplete;

      const elementTitle = component.shadowRoot?.querySelector('.element-title');
      expect(elementTitle?.textContent).toContain('TestComponent');
    });

    it('should render path info', async () => {
      component.show = true;
      component.element = {
        name: 'div',
        path: '/src/App.tsx',
        line: 25,
        column: 5
      };
      await component.updateComplete;

      const pathLine = component.shadowRoot?.querySelector('.path-line');
      expect(pathLine?.textContent).toContain('/src/App.tsx:25:5');
    });
  });

  describe('Node Tree Tooltip', () => {
    it('should render tooltip with activeNode content', async () => {
      component.showNodeTree = true;
      component.activeNode = {
        content: '/path/to/file.ts:10:5',
        visibility: 'visible',
        top: '100px',
        left: '50px',
        class: 'tooltip-top'
      };
      await component.updateComplete;

      const tooltip = component.shadowRoot?.querySelector('#node-tree-tooltip');
      expect(tooltip?.textContent?.trim()).toBe('/path/to/file.ts:10:5');
    });

    it('should hide tooltip when showNodeTree is false', async () => {
      component.showNodeTree = false;
      component.activeNode = {
        content: 'test',
        visibility: 'visible'
      };
      await component.updateComplete;

      const tooltip = component.shadowRoot?.querySelector('#node-tree-tooltip') as HTMLElement;
      expect(tooltip?.style.display).toBe('none');
    });
  });

  describe('renderNodeTree', () => {
    it('should render tree nodes', async () => {
      const treeNode = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [],
        element: document.createElement('div'),
        depth: 1
      };

      component.showNodeTree = true;
      component.nodeTree = treeNode;
      await component.updateComplete;

      const layers = component.shadowRoot?.querySelectorAll('.inspector-layer');
      expect(layers?.length).toBeGreaterThan(0);
    });

    it('should render nested children', async () => {
      const childElement = document.createElement('span');
      const parentElement = document.createElement('div');

      const treeNode = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [{
          name: 'span',
          path: '/path/file.ts',
          line: 15,
          column: 8,
          children: [],
          element: childElement,
          depth: 2
        }],
        element: parentElement,
        depth: 1
      };

      component.showNodeTree = true;
      component.nodeTree = treeNode;
      await component.updateComplete;

      const layers = component.shadowRoot?.querySelectorAll('.inspector-layer');
      expect(layers?.length).toBe(2);
    });

    it('should trigger click handler on tree node', async () => {
      const treeElement = document.createElement('div');
      treeElement.setAttribute(PathName, '/path/file.ts:10:5:div');

      const treeNode = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [],
        element: treeElement,
        depth: 1
      };

      component.showNodeTree = true;
      component.nodeTree = treeNode;
      await component.updateComplete;

      const handleClickTreeNodeSpy = vi.spyOn(component, 'handleClickTreeNode');

      const layer = component.shadowRoot?.querySelector('.inspector-layer') as HTMLElement;
      layer?.click();

      expect(handleClickTreeNodeSpy).toHaveBeenCalledWith(treeNode);
    });

    it('should trigger mouseenter handler on tree node', async () => {
      const treeElement = document.createElement('div');
      treeElement.setAttribute(PathName, '/path/file.ts:10:5:div');
      document.body.appendChild(treeElement);

      const treeNode = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [],
        element: treeElement,
        depth: 1
      };

      component.showNodeTree = true;
      component.nodeTree = treeNode;
      await component.updateComplete;

      const handleMouseEnterNodeSpy = vi.spyOn(component, 'handleMouseEnterNode');

      const layer = component.shadowRoot?.querySelector('.inspector-layer') as HTMLElement;
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
      layer?.dispatchEvent(mouseEnterEvent);

      expect(handleMouseEnterNodeSpy).toHaveBeenCalled();

      document.body.removeChild(treeElement);
    });

    it('should trigger mouseleave handler on tree node', async () => {
      const treeElement = document.createElement('div');

      const treeNode = {
        name: 'div',
        path: '/path/file.ts',
        line: 10,
        column: 5,
        children: [],
        element: treeElement,
        depth: 1
      };

      component.showNodeTree = true;
      component.nodeTree = treeNode;
      await component.updateComplete;

      // Set up initial state that handleMouseLeaveNode will modify
      component.activeNode = {
        visibility: 'visible',
        content: 'test'
      };

      const layer = component.shadowRoot?.querySelector('.inspector-layer') as HTMLElement;
      const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      layer?.dispatchEvent(mouseLeaveEvent);

      // handleMouseLeaveNode sets visibility to 'hidden'
      expect(component.activeNode.visibility).toBe('hidden');
    });
  });

  describe('Box Model Overlays', () => {
    it('should render margin overlay', async () => {
      component.show = true;
      await component.updateComplete;

      const marginOverlay = component.shadowRoot?.querySelector('.margin-overlay');
      expect(marginOverlay).toBeTruthy();
    });

    it('should render border overlay', async () => {
      component.show = true;
      await component.updateComplete;

      const borderOverlay = component.shadowRoot?.querySelector('.border-overlay');
      expect(borderOverlay).toBeTruthy();
    });

    it('should render padding overlay', async () => {
      component.show = true;
      await component.updateComplete;

      const paddingOverlay = component.shadowRoot?.querySelector('.padding-overlay');
      expect(paddingOverlay).toBeTruthy();
    });

    it('should render content overlay', async () => {
      component.show = true;
      await component.updateComplete;

      const contentOverlay = component.shadowRoot?.querySelector('.content-overlay');
      expect(contentOverlay).toBeTruthy();
    });
  });
});
