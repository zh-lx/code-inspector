// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('Lifecycle methods', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (component && component.parentElement) {
      document.body.removeChild(component);
    }
    vi.clearAllMocks();
  });

  describe('firstUpdated', () => {
    it('should initialize internal states from properties', async () => {
      component = new CodeInspectorComponent();
      component.locate = true;
      component.copy = 'custom';
      component.target = 'https://example.com';
      component.hideConsole = true;

      document.body.appendChild(component);
      await component.updateComplete;

      expect(component.internalLocate).toBe(true);
      expect(component.internalCopy).toBe(true);
      expect(component.internalTarget).toBe(true);
    });

    it('should call printTip when hideConsole is false', async () => {
      component = new CodeInspectorComponent();
      component.hideConsole = false;

      const printTipSpy = vi.spyOn(component, 'printTip');

      document.body.appendChild(component);
      await component.updateComplete;

      expect(printTipSpy).toHaveBeenCalled();
    });

    it('should not call printTip when hideConsole is true', async () => {
      component = new CodeInspectorComponent();
      component.hideConsole = true;

      const printTipSpy = vi.spyOn(component, 'printTip');

      document.body.appendChild(component);
      await component.updateComplete;

      expect(printTipSpy).not.toHaveBeenCalled();
    });

    it('should add event listeners on firstUpdated', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      component = new CodeInspectorComponent();
      component.hideConsole = true;
      document.body.appendChild(component);
      await component.updateComplete;

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
    });
  });

  describe('disconnectedCallback', () => {
    it('should remove event listeners on disconnect', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      component = new CodeInspectorComponent();
      component.hideConsole = true;
      document.body.appendChild(component);
      await component.updateComplete;

      document.body.removeChild(component);

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function), true);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false } as EventListenerOptions);
    });
  });

  describe('Internal state initialization', () => {
    it('should set internalLocate to false when locate is false', async () => {
      component = new CodeInspectorComponent();
      component.locate = false;
      component.hideConsole = true;

      document.body.appendChild(component);
      await component.updateComplete;

      expect(component.internalLocate).toBe(false);
    });

    it('should set internalCopy to false when copy is false', async () => {
      component = new CodeInspectorComponent();
      component.copy = false;
      component.hideConsole = true;

      document.body.appendChild(component);
      await component.updateComplete;

      expect(component.internalCopy).toBe(false);
    });

    it('should set internalTarget to false when target is empty', async () => {
      component = new CodeInspectorComponent();
      component.target = '';
      component.hideConsole = true;

      document.body.appendChild(component);
      await component.updateComplete;

      expect(component.internalTarget).toBe(false);
    });
  });
});
