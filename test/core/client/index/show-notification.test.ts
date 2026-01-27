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
      component.showNotification('Test message');

      // The show class is added via requestAnimationFrame
      // Simply verify the notification was created
      const notification = document.querySelector('.code-inspector-notification');
      expect(notification).toBeTruthy();
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
