import { CodeInspectorComponent } from '@/core/src/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('isTracking', () => {
  let component: CodeInspectorComponent;
  
  beforeEach(() => {
    // 创建组件实例
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    // 清理
    document.body.removeChild(component);
  });

  it('should return true when all hotkeys are pressed', () => {
    const event = {
      shiftKey: true,
      altKey: true,
    };
    expect(component.isTracking(event)).toBe(true);
  });

  it('should return false when not all hotkeys are pressed', () => {
    const event = {
      shiftKey: true,
      altKey: false,
    };
    expect(component.isTracking(event)).toBe(false);
  });
});