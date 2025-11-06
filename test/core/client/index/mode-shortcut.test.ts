import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('mode shortcut', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    component.hideConsole = true;
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
  });

  it('cycles between copy and locate', () => {
    component.copy = true;
    component.locate = true;
    component.defaultAction = 'copy';

    const event = {
      key: 'c',
      code: 'KeyC',
      altKey: true,
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent;

    (component as any).handleModeShortcut(event);
    expect(component.defaultAction).toBe('locate');
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();

    (component as any).handleModeShortcut(event);
    expect(component.defaultAction).toBe('all');

    (component as any).handleModeShortcut(event);
    expect(component.defaultAction).toBe('copy');
  });

  it('ignores shortcut when only one action available', () => {
    component.copy = true;
    component.locate = false;
    component.defaultAction = 'copy';

    const event = {
      key: 'c',
      code: 'KeyC',
      altKey: true,
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent;

    (component as any).handleModeShortcut(event);
    expect(component.defaultAction).toBe('copy');
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
