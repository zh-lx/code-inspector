// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('handleModeShortcut', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  const createKeyboardEvent = (key: string, code: string, modifiers: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      code,
      bubbles: true,
      cancelable: true,
      ...modifiers
    });
    event.preventDefault = vi.fn();
    event.stopPropagation = vi.fn();
    return event;
  };

  describe('Trigger Conditions', () => {
    it('should toggle settings modal when hotkeys and mode key are pressed', () => {
      component.hotKeys = 'shiftKey,altKey';
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);

      const event = createKeyboardEvent('z', 'KeyZ', { shiftKey: true, altKey: true });

      // Access private method
      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not toggle when isTracking returns false', () => {
      component.hotKeys = 'shiftKey,altKey';
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(false);
      component.showSettingsModal = false;

      const event = createKeyboardEvent('z', 'KeyZ', { shiftKey: true, altKey: true });

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not toggle when wrong key is pressed', () => {
      component.hotKeys = 'shiftKey,altKey';
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);
      component.showSettingsModal = false;

      const event = createKeyboardEvent('x', 'KeyX', { shiftKey: true, altKey: true });

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Key Matching', () => {
    it('should match mode key using event.code (KeyZ)', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);

      const event = createKeyboardEvent('z', 'KeyZ');

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(true);
    });

    it('should match mode key using event.key', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);

      // Event with matching key but different code
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        code: 'SomeOtherCode',
        bubbles: true,
        cancelable: true
      });
      event.preventDefault = vi.fn();
      event.stopPropagation = vi.fn();

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(true);
    });

    it('should match lowercase mode key', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);

      const event = createKeyboardEvent('z', 'KeyZ');

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(true);
    });

    it('should handle custom mode key', () => {
      component.modeKey = 'm';
      component.isTracking = vi.fn().mockReturnValue(true);

      const event = createKeyboardEvent('m', 'KeyM');

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(true);
    });
  });

  describe('State Toggle', () => {
    it('should toggle showSettingsModal from false to true', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);
      component.showSettingsModal = false;

      const event = createKeyboardEvent('z', 'KeyZ');

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(true);
    });

    it('should toggle showSettingsModal from true to false', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);
      component.showSettingsModal = true;

      const event = createKeyboardEvent('z', 'KeyZ');

      (component as any).handleModeShortcut(event);

      expect(component.showSettingsModal).toBe(false);
    });
  });

  describe('Event Prevention', () => {
    it('should prevent default and stop propagation when triggered', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(true);

      const event = createKeyboardEvent('z', 'KeyZ');

      (component as any).handleModeShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('should not prevent default when not triggered', () => {
      component.modeKey = 'z';
      component.isTracking = vi.fn().mockReturnValue(false);

      const event = createKeyboardEvent('z', 'KeyZ');

      (component as any).handleModeShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });
});
