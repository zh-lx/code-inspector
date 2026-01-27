// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('toggleSettingsModal and related functions', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('toggleSettingsModal', () => {
    it('should toggle showSettingsModal from false to true', () => {
      component.showSettingsModal = false;

      component.toggleSettingsModal();

      expect(component.showSettingsModal).toBe(true);
    });

    it('should toggle showSettingsModal from true to false', () => {
      component.showSettingsModal = true;

      component.toggleSettingsModal();

      expect(component.showSettingsModal).toBe(false);
    });

    it('should handle multiple toggles correctly', () => {
      component.showSettingsModal = false;

      component.toggleSettingsModal(); // false -> true
      expect(component.showSettingsModal).toBe(true);

      component.toggleSettingsModal(); // true -> false
      expect(component.showSettingsModal).toBe(false);

      component.toggleSettingsModal(); // false -> true
      expect(component.showSettingsModal).toBe(true);
    });
  });

  describe('closeSettingsModal', () => {
    it('should set showSettingsModal to false', () => {
      component.showSettingsModal = true;

      component.closeSettingsModal();

      expect(component.showSettingsModal).toBe(false);
    });

    it('should keep showSettingsModal false if already false', () => {
      component.showSettingsModal = false;

      component.closeSettingsModal();

      expect(component.showSettingsModal).toBe(false);
    });
  });

  describe('toggleLocate', () => {
    it('should toggle internalLocate from true to false', () => {
      component.internalLocate = true;

      component.toggleLocate();

      expect(component.internalLocate).toBe(false);
    });

    it('should toggle internalLocate from false to true', () => {
      component.internalLocate = false;

      component.toggleLocate();

      expect(component.internalLocate).toBe(true);
    });
  });

  describe('toggleCopy', () => {
    it('should toggle internalCopy from false to true', () => {
      component.internalCopy = false;

      component.toggleCopy();

      expect(component.internalCopy).toBe(true);
    });

    it('should toggle internalCopy from true to false', () => {
      component.internalCopy = true;

      component.toggleCopy();

      expect(component.internalCopy).toBe(false);
    });
  });

  describe('toggleTarget', () => {
    it('should toggle internalTarget from false to true', () => {
      component.internalTarget = false;

      component.toggleTarget();

      expect(component.internalTarget).toBe(true);
    });

    it('should toggle internalTarget from true to false', () => {
      component.internalTarget = true;

      component.toggleTarget();

      expect(component.internalTarget).toBe(false);
    });
  });

  describe('features array', () => {
    it('should have three features', () => {
      expect(component.features.length).toBe(3);
    });

    it('should have Locate Code feature', () => {
      const locateFeature = component.features.find(f => f.label === 'Locate Code');
      expect(locateFeature).toBeDefined();
      expect(locateFeature!.description).toBe('Open the editor and locate code');
    });

    it('should have Copy Path feature', () => {
      const copyFeature = component.features.find(f => f.label === 'Copy Path');
      expect(copyFeature).toBeDefined();
      expect(copyFeature!.description).toBe('Copy the code path to clipboard');
    });

    it('should have Open Target feature', () => {
      const targetFeature = component.features.find(f => f.label === 'Open Target');
      expect(targetFeature).toBeDefined();
      expect(targetFeature!.description).toBe('Open the target url');
    });

    it('should have checked functions that reflect internal state', () => {
      component.internalLocate = true;
      component.internalCopy = false;
      component.internalTarget = true;

      expect(component.features[0].checked()).toBe(true);  // Locate
      expect(component.features[1].checked()).toBe(false); // Copy
      expect(component.features[2].checked()).toBe(true);  // Target
    });

    it('should have onChange functions that toggle states', () => {
      component.internalLocate = true;
      component.internalCopy = false;
      component.internalTarget = false;

      component.features[0].onChange(); // Toggle Locate
      expect(component.internalLocate).toBe(false);

      component.features[1].onChange(); // Toggle Copy
      expect(component.internalCopy).toBe(true);

      component.features[2].onChange(); // Toggle Target
      expect(component.internalTarget).toBe(true);
    });
  });
});
