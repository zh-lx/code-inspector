import { CodeInspectorComponent } from '@/core/src/client';
import { DefaultPort } from '@/core/src/shared';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('properties', () => {
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

  it('should have default properties', () => {
    expect(component.hotKeys).toBe('shiftKey,altKey');
    expect(component.port).toBe(DefaultPort); // DefaultPort value
    expect(component.showSwitch).toBe(false);
    expect(component.autoToggle).toBe(false);
    expect(component.hideConsole).toBe(false);
    expect(component.locate).toBe(true);
    expect(component.copy).toBe(false);
    expect(component.target).toBe('');
    expect(component.ip).toBe('localhost');
  });

  it('should use properties from attributes', () => {
    component.hotKeys = 'altKey';
    component.port = 6666;
    component.showSwitch = true;
    component.autoToggle = true;
    component.hideConsole = true;
    component.locate = false;
    component.copy = 'custom';
    component.target = 'https://example.com';
    component.ip = '192.168.1.100';

    expect(component.hotKeys).toBe('altKey');
    expect(component.port).toBe(6666);
    expect(component.showSwitch).toBe(true);
    expect(component.autoToggle).toBe(true);
    expect(component.hideConsole).toBe(true);
    expect(component.locate).toBe(false);
    expect(component.copy).toBe('custom');
    expect(component.target).toBe('https://example.com');
    expect(component.ip).toBe('192.168.1.100');
  });
});
