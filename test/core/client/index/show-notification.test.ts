// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('showNotification', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(component);
    // Clean up any notifications
    document.querySelectorAll('.code-inspector-notification').forEach(el => el.remove());
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Notification Creation', () => {
    it('should create notification element', () => {
      component.showNotification('Test message');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy();
    });

    it('should set notification text content', () => {
      component.showNotification('Test message');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.textContent).toBe('Test message');
    });

    it('should append notification to document body', () => {
      component.showNotification('Test message');

      const notification = document.body.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy();
    });
  });

  describe('Notification Types', () => {
    it('should add success class by default', () => {
      component.showNotification('Success message');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.classList.contains('code-inspector-notification-success')).toBe(true);
    });

    it('should add success class when type is success', () => {
      component.showNotification('Success message', 'success');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.classList.contains('code-inspector-notification-success')).toBe(true);
    });

    it('should add error class when type is error', () => {
      component.showNotification('Error message', 'error');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.classList.contains('code-inspector-notification-error')).toBe(true);
    });
  });

  describe('Animation', () => {
    it('should add show class via requestAnimationFrame', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      component.showNotification('Test message');

      // Verify requestAnimationFrame was called
      expect(rafSpy).toHaveBeenCalledTimes(1);
      expect(rafSpy).toHaveBeenCalledWith(expect.any(Function));

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy();

      // Initially, the show class should not be present
      expect(notification?.classList.contains('code-inspector-notification-show')).toBe(false);

      // Execute the requestAnimationFrame callback
      const rafCallback = rafSpy.mock.calls[0][0];
      rafCallback(0);

      // After the callback, the show class should be added
      expect(notification?.classList.contains('code-inspector-notification-show')).toBe(true);

      rafSpy.mockRestore();
    });

    it('should trigger animation by adding show class after notification is appended', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      component.showNotification('Animation test');

      const notification = document.querySelector('.code-inspector-notification');

      // Notification should be in DOM before requestAnimationFrame
      expect(notification).toBeTruthy();
      expect(document.body.contains(notification!)).toBe(true);

      // Show class should not be present yet
      expect(notification?.classList.contains('code-inspector-notification-show')).toBe(false);

      // Execute the animation frame callback
      const rafCallback = rafSpy.mock.calls[0][0];
      rafCallback(0);

      // Now the show class should be present
      expect(notification?.classList.contains('code-inspector-notification-show')).toBe(true);

      rafSpy.mockRestore();
    });

    it('should handle multiple notifications with separate animation frames', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      component.showNotification('First');
      component.showNotification('Second');

      // Should call requestAnimationFrame twice
      expect(rafSpy).toHaveBeenCalledTimes(2);

      const notifications = document.querySelectorAll('.code-inspector-notification');
      expect(notifications.length).toBe(2);

      // Execute both callbacks
      rafSpy.mock.calls.forEach(([callback]) => callback(0));

      // Both should have show class
      notifications.forEach(notification => {
        expect(notification.classList.contains('code-inspector-notification-show')).toBe(true);
      });

      rafSpy.mockRestore();
    });
  });

  describe('Auto Removal', () => {
    it('should create notification with proper setup for removal', async () => {
      component.showNotification('Test message');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy();
      // Notification is created and will be removed after timeouts
    });

    it('should remove notification from DOM after 2.3 seconds total', async () => {
      component.showNotification('Test message');

      await vi.advanceTimersByTimeAsync(16); // Animation frame
      let notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy();

      await vi.advanceTimersByTimeAsync(2000); // Remove show class
      notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy(); // Still in DOM

      await vi.advanceTimersByTimeAsync(300); // Final removal
      notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeFalsy();
    });
  });

  describe('Multiple Notifications', () => {
    it('should handle multiple notifications', async () => {
      component.showNotification('First message');
      component.showNotification('Second message');

      const notifications = document.querySelectorAll('.code-inspector-notification');
      expect(notifications.length).toBe(2);
    });
  });

  describe('Message Content', () => {
    it('should handle empty message', () => {
      component.showNotification('');

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.textContent).toBe('');
    });

    it('should handle long message', () => {
      const longMessage = 'A'.repeat(1000);
      component.showNotification(longMessage);

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.textContent).toBe(longMessage);
    });

    it('should handle special characters', () => {
      const specialMessage = '✓ Copy <successful> & done!';
      component.showNotification(specialMessage);

      const notification = document.querySelector('.code-inspector-notification');
      expect(notification?.textContent).toBe(specialMessage);
    });
  });
});
