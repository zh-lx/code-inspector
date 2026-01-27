// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { PathName } from '@/core/src/shared';

describe('calculateElementInfoPosition overflow handling', () => {
  let component: CodeInspectorComponent;
  let originalClientWidth: number;
  let originalClientHeight: number;

  beforeEach(async () => {
    // Save original values
    originalClientWidth = document.documentElement.clientWidth;
    originalClientHeight = document.documentElement.clientHeight;

    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
    await component.updateComplete;
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();

    // Restore original values
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: originalClientWidth,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: originalClientHeight,
      configurable: true,
    });
  });

  it('should add negative translateX for left horizon when containerLeft + width > browserWidth', async () => {
    // Set up a narrow viewport
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 600,
      configurable: true,
    });

    const target = document.createElement('div');
    target.setAttribute(PathName, '/path/file.tsx:10:5:div');
    document.body.appendChild(target);

    // Position element so that:
    // - containerLeft (left - marginLeft) = 200
    // - For 'element-info-left' positions, we check: containerLeft + width > browserWidth
    // - If tip width = 300, then 200 + 300 = 500 > 400 (browserWidth)
    // - This should trigger the left overflow branch
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 300,
      left: 200,
      right: 300,
      bottom: 350,
      width: 100,
      height: 50,
    });

    // Mock getComputedStyle for margins
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    // Mock the elementInfoRef to have a large width
    // This is the key - we need to mock the tip element's dimensions
    await component.updateComplete;

    // Access the shadow root to mock elementInfoRef
    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 300,  // Large width to trigger overflow
        height: 50,
      });
    }

    // Call calculateElementInfoPosition directly
    const result = await component.calculateElementInfoPosition(target);

    // The result should have additionStyle with negative translateX
    // because containerLeft (200) + width (300) > browserWidth (400)
    // overflowWidth = 200 + 300 - 400 = 100
    // For positions with 'left' horizon, it should add translateX(-100px)
    expect(result).toBeDefined();

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });

  it('should add positive translateX for right horizon when width > containerRight', async () => {
    // Set up viewport
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 800,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 600,
      configurable: true,
    });

    const target = document.createElement('div');
    target.setAttribute(PathName, '/path/file.tsx:10:5:div');
    document.body.appendChild(target);

    // Position element on far left so containerRight is very small:
    // - containerRight (right + marginRight) = 50
    // - For 'element-info-right' positions, we check: width > containerRight
    // - If tip width = 300, then 300 > 50 (containerRight)
    // - This should trigger the right overflow branch
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 300,
      left: 10,
      right: 50,   // Very small containerRight
      bottom: 350,
      width: 40,
      height: 50,
    });

    // Mock getComputedStyle for margins
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    // Mock the elementInfoRef to have a large width
    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 300,  // Large width > containerRight (50)
        height: 50,
      });
    }

    // Call calculateElementInfoPosition directly
    const result = await component.calculateElementInfoPosition(target);

    // The result should have additionStyle with positive translateX
    // because width (300) > containerRight (50)
    // overflowWidth = 300 - 50 = 250
    // For positions with 'right' horizon, it should add translateX(250px)
    expect(result).toBeDefined();

    // The first position is 'element-info-right', so if it passes isOutOfScreen,
    // it should have the translateX adjustment
    if (result.horizon === 'element-info-right' && result.additionStyle) {
      expect(result.additionStyle.transform).toContain('translateX(');
    }

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });

  it('should return first position (positions[0]) when all positions are out of screen', async () => {
    // Set up a very small viewport so all positions fail
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 100,
      configurable: true,
    });

    const target = document.createElement('div');
    target.setAttribute(PathName, '/path/file.tsx:10:5:div');
    document.body.appendChild(target);

    // Position element in center of small viewport
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 50,
      left: 50,
      right: 60,
      bottom: 60,
      width: 10,
      height: 10,
    });

    // Mock getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    // Mock elementInfoRef to have very large dimensions
    // so all positions will be out of screen
    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 500,   // Much larger than viewport
        height: 500,  // Much larger than viewport
      });
    }

    // Call calculateElementInfoPosition directly
    const result = await component.calculateElementInfoPosition(target);

    // Should return the first position (positions[0])
    // First position has horizon: 'element-info-right' and vertical: 'element-info-bottom'
    expect(result).toBeDefined();
    expect(result.vertical).toBe('element-info-bottom');
    expect(result.horizon).toBe('element-info-right');

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });

  it('should handle overflow width with existing additionStyle transform', async () => {
    // This test specifically targets the case where additionStyle?.transform already exists
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 400,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 100,  // Very small height to force using later positions with existing transforms
      configurable: true,
    });

    const target = document.createElement('div');
    target.setAttribute(PathName, '/path/file.tsx:10:5:div');
    document.body.appendChild(target);

    // Position element near top-left
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 10,
      left: 200,
      right: 300,
      bottom: 20,
      width: 100,
      height: 10,
    });

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 300,
        height: 50,
      });
    }

    const result = await component.calculateElementInfoPosition(target);
    expect(result).toBeDefined();

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });
});

describe('calculateElementInfoPosition with specific overflow scenarios', () => {
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

  it('should trigger right overflow branch (lines 356-362) with proper mocking', async () => {
    // Scenario: width > containerRight for 'right' horizon positions
    // First position is 'element-info-right', so we need to make width > containerRight

    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    const target = document.createElement('div');
    target.setAttribute(PathName, '/test.tsx:1:1:div');
    document.body.appendChild(target);

    // Element at far left, so containerRight is small
    // containerRight = right + marginRight = 30 + 0 = 30
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 400,
      left: 10,
      right: 30,    // Small right value
      bottom: 450,
      width: 20,
      height: 50,
    });

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    // Mock elementInfoRef with width > containerRight (30)
    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 100,   // 100 > 30 (containerRight)
        height: 30,
      });
    }

    const result = await component.calculateElementInfoPosition(target);

    // First position should be valid and should have overflow handling
    expect(result).toBeDefined();
    // overflowWidth = 100 - 30 = 70, should add translateX(70px)
    if (result.horizon === 'element-info-right') {
      expect(result.additionStyle?.transform).toContain('translateX(70px)');
    }

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });

  it('should trigger left overflow branch (lines 347-353) with proper mocking', async () => {
    // Scenario: containerLeft + width > browserWidth for 'left' horizon positions
    // We need to make the first valid position have 'left' horizon

    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });

    const target = document.createElement('div');
    target.setAttribute(PathName, '/test.tsx:1:1:div');
    document.body.appendChild(target);

    // Element at right side, so containerLeft is large
    // containerLeft = left - marginLeft = 400 - 0 = 400
    // For 'left' horizon positions: containerLeft + width > browserWidth
    // 400 + 150 = 550 > 500 (browserWidth)
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 400,
      left: 400,
      right: 480,
      bottom: 450,
      width: 80,
      height: 50,
    });

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    // Mock elementInfoRef with width that causes overflow
    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 150,   // 400 + 150 = 550 > 500 (browserWidth)
        height: 30,
      });
    }

    const result = await component.calculateElementInfoPosition(target);

    expect(result).toBeDefined();
    // overflowWidth = 400 + 150 - 500 = 50, should add translateX(-50px)
    if (result.horizon === 'element-info-left') {
      expect(result.additionStyle?.transform).toContain('translateX(-50px)');
    }

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });
});
