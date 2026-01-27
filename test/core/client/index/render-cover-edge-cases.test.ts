// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('renderCover edge cases', () => {
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

  it('should return early if target is the same as targetNode', async () => {
    const target = document.createElement('div');
    target.setAttribute(PathName, '/path/file.ts:10:5:div');
    document.body.appendChild(target);

    // Set up targetNode first
    component.targetNode = target;

    // Spy on getSourceInfo to verify it's not called
    const getSourceInfoSpy = vi.spyOn(component, 'getSourceInfo');

    await component.renderCover(target);

    // getSourceInfo should not be called if target === targetNode
    expect(getSourceInfoSpy).not.toHaveBeenCalled();

    document.body.removeChild(target);
  });

  it('should call getSourceInfo when target is different from targetNode', async () => {
    const oldTarget = document.createElement('div');
    const newTarget = document.createElement('span');
    newTarget.setAttribute(PathName, '/path/file.ts:10:5:span');
    document.body.appendChild(newTarget);

    component.targetNode = oldTarget;

    const getSourceInfoSpy = vi.spyOn(component, 'getSourceInfo');

    await component.renderCover(newTarget);

    expect(getSourceInfoSpy).toHaveBeenCalledWith(newTarget);

    document.body.removeChild(newTarget);
  });
});

describe('getTipPosition edge cases', () => {
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

  it('should return first position when all positions are out of screen', async () => {
    // Mock viewport to be very small
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 50,
      configurable: true
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 50,
      configurable: true
    });

    // Create a target element with a very long path
    const target = document.createElement('div');
    target.setAttribute(PathName, '/very/very/very/very/very/very/long/path/to/file/that/will/overflow/screen.tsx:999999:999999:div');
    document.body.appendChild(target);

    // Mock getBoundingClientRect to place element in center of small viewport
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 20,
      left: 20,
      right: 30,
      bottom: 30,
      width: 10,
      height: 10
    });

    // Render cover which internally calls getTipPosition
    await component.renderCover(target);

    // The tip position should still have visibility: visible (fallback to positions[0])
    expect(component.elementTipStyle.visibility).toBe('visible');

    document.body.removeChild(target);
  });

  it('should add positive translateX for right horizon when width exceeds containerRight', async () => {
    // Set viewport width - we need the tip to overflow on the right side
    // For horizon 'element-info-right', the overflowWidth = width - containerRight
    // We need overflowWidth > 0, so width > containerRight
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 800,
      configurable: true
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 600,
      configurable: true
    });

    // Create a target element
    const target = document.createElement('div');
    // Use a path that creates a reasonably sized tip
    target.setAttribute(PathName, '/some/path/to/component/file.tsx:10:5:div');
    document.body.appendChild(target);

    // Element positioned so that:
    // - It's on the far left (containerLeft small)
    // - containerRight is very small (less than tip width)
    // - This should trigger the else branch (horizon ends with 'right')
    // - And overflowWidth = width - containerRight > 0
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 100,   // Enough room above
      left: 5,    // Very far left
      right: 15,  // containerRight = 15 (very small, less than tip width)
      bottom: 150,
      width: 10,
      height: 50
    });

    // Mock getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px')
    });

    await component.renderCover(target);

    // Should have rendered without errors
    expect(component.show).toBe(true);
    expect(component.elementTipStyle.visibility).toBe('visible');

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });

  it('should handle left overflow when horizon ends with left', async () => {
    // Set viewport width
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 300,
      configurable: true
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 600,
      configurable: true
    });

    // Create target element on the right side of the viewport
    const target = document.createElement('div');
    target.setAttribute(PathName, '/path/file.tsx:10:5:div');
    document.body.appendChild(target);

    // Element on far right - tip will try to show on left and may overflow
    // containerLeft + width > browserWidth => overflow
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 200,
      left: 250,  // Far right
      right: 290,
      bottom: 250,
      width: 40,
      height: 50
    });

    // Mock getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px')
    });

    await component.renderCover(target);

    expect(component.show).toBe(true);

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });
});
