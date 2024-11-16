import { CodeInspectorComponent } from '@/core/src/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('getDomPropertyValue', () => {
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

  it('should convert pixel values to numbers', () => {
    const div = document.createElement('div');
    div.style.marginTop = '20px';
    document.body.appendChild(div);
    
    const value = component.getDomPropertyValue(div, 'margin-top');
    expect(value).toBe(20);
    
    document.body.removeChild(div);
  });
});