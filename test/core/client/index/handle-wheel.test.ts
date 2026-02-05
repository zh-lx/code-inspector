// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('handleWheel', () => {
  let component: CodeInspectorComponent;
  let renderCoverCalls: HTMLElement[] = [];

  const createValidNodes = (num: number) => {
    const validNodes = [] as HTMLDivElement[];
    for (let i = 0; i < num; i++) {
      const validNode = document.createElement('div');
      validNode.setAttribute(PathName, `/path/to/file.ts:${i}:5:div`);
      validNodes.push(validNode);
    }
    return validNodes;
  };

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);

    // 模拟方法
    component.renderCover = vi.fn(async (targetNode: HTMLElement) => {
      component.targetNode = targetNode;
      renderCoverCalls.push(targetNode);
    });
    component.removeCover = vi.fn();
    component.isTracking = vi.fn().mockReturnValue(true);
  });

  afterEach(() => {
    document.body.removeChild(component);
    renderCoverCalls = [];
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should move to next valid node when wheel scrolls up (deltaX < 0)', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode0);

      const wheelUpEvent = new WheelEvent('wheel', { deltaX: -40 });
      wheelUpEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelUpEvent);

      expect(renderCoverCalls).toEqual([validNode0, validNode1]);
    });

    it('should move to previous valid node when wheel scrolls down (deltaX > 0)', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode1);

      const wheelDownEvent = new WheelEvent('wheel', { deltaX: 40 });
      wheelDownEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelDownEvent);

      expect(renderCoverCalls).toEqual([validNode1, validNode0]);
    });

    it('should handle multiple valid nodes correctly', async () => {
      vi.useFakeTimers();
      const [validNode0, validNode1, validNode2] = createValidNodes(3);

      component.renderCover(validNode0);

      const wheelUpEvent0 = new WheelEvent('wheel', { deltaX: -40 });
      const wheelUpEvent1 = new WheelEvent('wheel', { deltaX: -40 });
      const wheelDownEvent0 = new WheelEvent('wheel', { deltaX: 40 });
      const wheelDownEvent1 = new WheelEvent('wheel', { deltaX: 40 });

      const composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.createElement('div'),
          validNode2,
          document.body
        ] as EventTarget[]);

      wheelUpEvent0.composedPath = composedPath;
      wheelUpEvent1.composedPath = composedPath;
      wheelDownEvent0.composedPath = composedPath;
      wheelDownEvent1.composedPath = composedPath;

      component.handleWheel(wheelUpEvent0);
      await vi.advanceTimersByTimeAsync(200);
      component.handleWheel(wheelUpEvent1);
      await vi.advanceTimersByTimeAsync(200);
      component.handleWheel(wheelDownEvent0);
      await vi.advanceTimersByTimeAsync(200);
      component.handleWheel(wheelDownEvent1);

      expect(renderCoverCalls).toEqual([
        validNode0,
        validNode1,
        validNode2,
        validNode1,
        validNode0
      ]);

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should use deltaY when deltaX is 0', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode0);

      // Use deltaY instead of deltaX
      const wheelUpEvent = new WheelEvent('wheel', { deltaX: 0, deltaY: -40 });
      wheelUpEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelUpEvent);

      expect(renderCoverCalls).toEqual([validNode0, validNode1]);
    });

    it('should move to previous node when deltaY is positive', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode1);

      // Use deltaY with positive value
      const wheelDownEvent = new WheelEvent('wheel', { deltaX: 0, deltaY: 40 });
      wheelDownEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelDownEvent);

      expect(renderCoverCalls).toEqual([validNode1, validNode0]);
    });

    it('should not change node when both deltaX and deltaY are 0', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode0);

      // Both deltas are 0
      const wheelEvent = new WheelEvent('wheel', { deltaX: 0, deltaY: 0 });
      wheelEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelEvent);

      // When wheelDelta is 0, targetNodeIndex stays the same (0)
      // renderCover is called with the same node (validNode0)
      expect(renderCoverCalls).toEqual([validNode0, validNode0]);
    });

    it('should not move when already at the last node and scrolling up', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode1);

      const wheelUpEvent = new WheelEvent('wheel', { deltaX: -40 });
      wheelUpEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelUpEvent);

      expect(renderCoverCalls).toEqual([validNode1]);
    });

    it('should not move when already at the first node and scrolling down', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode0);

      const wheelDownEvent = new WheelEvent('wheel', { deltaX: 40 });
      wheelDownEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelDownEvent);

      expect(renderCoverCalls).toEqual([validNode0]);
    });

    it('should not do anything when targetNode is null', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      const wheelUpEvent = new WheelEvent('wheel', { deltaX: -40 });
      wheelUpEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelUpEvent);

      expect(renderCoverCalls).toEqual([]);
    });

    it('should not do anything when wheelThrottling is true', () => {
      const [validNode0, validNode1] = createValidNodes(2);

      component.renderCover(validNode0);

      // Set wheelThrottling to true to simulate throttling state
      (component as any).wheelThrottling = true;

      const wheelUpEvent = new WheelEvent('wheel', { deltaX: -40 });
      wheelUpEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelUpEvent);

      // renderCover should only have been called once (in setup), not again
      expect(renderCoverCalls).toEqual([validNode0]);
    });

    it('should not do anything when targetNode is not in composedPath', () => {
      const [validNode0, validNode1, unrelatedNode] = createValidNodes(3);

      component.renderCover(unrelatedNode);

      const wheelUpEvent = new WheelEvent('wheel', { deltaX: -40 });
      wheelUpEvent.composedPath = vi
        .fn()
        .mockReturnValue([
          validNode0,
          document.createElement('div'),
          validNode1,
          document.body
        ] as EventTarget[]);

      component.handleWheel(wheelUpEvent);

      expect(renderCoverCalls).toEqual([unrelatedNode]);
    });
  });
});
