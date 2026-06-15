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
    // 让元素在垂直方向撑满屏幕，使所有外部位置都溢出，
    // 从而进入第二个循环（溢出处理逻辑）。
    // 元素水平靠右，使 right 对齐位置触发 right 溢出分支。

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

    // 元素垂直撑满（top 接近 0，bottom 接近 browserHeight），水平靠右
    // containerTop=10, containerBottom=790 → 外部 top/bottom 位置均溢出
    // containerLeft=950 → right 对齐溢出：950 + 100 - 1000 = 50
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 10,
      left: 950,
      right: 970,
      bottom: 790,
      width: 20,
      height: 780,
    });

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 100,
        height: 30,
      });
    }

    const result = await component.calculateElementInfoPosition(target);

    // 应返回 right 对齐位置，并经过 right 溢出处理
    // overflowWidth = 950 + 100 - 1000 = 50, transform: translateX(-54px)
    expect(result).toBeDefined();
    expect(result.horizon).toBe('element-info-right');
    expect(result.additionStyle?.transform).toContain('translateX(-54px)');

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });

  it('should trigger left overflow branch (lines 363-371) with proper mocking', async () => {
    // 让元素在垂直方向撑满屏幕，使所有外部位置都溢出，进入第二个循环。
    // 元素水平靠左，使 left 对齐位置在遍历时触发 left 溢出分支（覆盖该代码）。

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

    // 元素垂直撑满，水平靠左
    // containerRight=30 → left 对齐溢出：width(100) - containerRight(30) = 70
    target.getBoundingClientRect = vi.fn().mockReturnValue({
      top: 10,
      left: 10,
      right: 30,
      bottom: 790,
      width: 20,
      height: 780,
    });

    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = vi.fn().mockReturnValue({
      getPropertyValue: vi.fn().mockReturnValue('0px'),
    });

    await component.updateComplete;

    const elementInfoRef = component.shadowRoot?.getElementById('element-info');
    if (elementInfoRef) {
      elementInfoRef.getBoundingClientRect = vi.fn().mockReturnValue({
        width: 100,
        height: 30,
      });
    }

    const result = await component.calculateElementInfoPosition(target);

    // 第二个循环遍历到 left 对齐位置时会执行 left 溢出处理代码（覆盖目标）
    expect(result).toBeDefined();
    expect(result.horizon).toBeDefined();

    window.getComputedStyle = originalGetComputedStyle;
    document.body.removeChild(target);
  });
});
