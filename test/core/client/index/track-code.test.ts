import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';
import { formatOpenPath } from 'launch-ide';

// 模拟 formatOpenPath
vi.mock('launch-ide', () => ({
  formatOpenPath: vi.fn().mockReturnValue(['formatted/path:10:5']),
}));
vi.mock('@/core/src/shared', () => ({
  DefaultPort: 5678
}));

describe('trackCode', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    // 创建组件实例
    component = new CodeInspectorComponent();
    
    // 设置基本属性
    component.element = {
      path: '/path/to/file.ts',
      line: 10,
      column: 5,
      name: 'test'
    };
    
    // 模拟方法
    component.sendXHR = vi.fn();
    component.sendImg = vi.fn();
    component.copyToClipboard = vi.fn();
  });

  describe('Locate Functionality', () => {
    beforeEach(() => {
      component.locate = true;
    });

    it('should call sendXHR when sendType is xhr', () => {
      component.sendType = 'xhr';
      component.trackCode('locate');
      
      expect(component.sendXHR).toHaveBeenCalled();
      expect(component.sendImg).not.toHaveBeenCalled();
    });

    it('should call sendImg when sendType is img', () => {
      component.sendType = 'img';
      component.trackCode('locate');
      
      expect(component.sendImg).toHaveBeenCalled();
      expect(component.sendXHR).not.toHaveBeenCalled();
    });

    it('should not call any send method when locate is false', () => {
      component.locate = false;
      component.sendType = 'xhr';
      component.trackCode('locate');
      
      expect(component.sendXHR).not.toHaveBeenCalled();
      expect(component.sendImg).not.toHaveBeenCalled();
    });
  });

  describe('Copy Functionality', () => {
    beforeEach(() => {
      component.copy = true;
    });

    it('should not call formatOpenPath when copy is false', () => {
      component.copy = false;
      component.trackCode('copy');
      
      expect(formatOpenPath).not.toHaveBeenCalled();
      expect(component.copyToClipboard).not.toHaveBeenCalled();
    });

    it('should handle both locate and copy being false', () => {
      component.locate = false;
      component.copy = false;
      
      component.trackCode('copy');
      
      expect(component.sendXHR).not.toHaveBeenCalled();
      expect(component.sendImg).not.toHaveBeenCalled();
      expect(formatOpenPath).not.toHaveBeenCalled();
      expect(component.copyToClipboard).not.toHaveBeenCalled();
    });

    it('should call formatOpenPath and copyToClipboard when copy is true', () => {
      component.trackCode('copy');
      
      expect(formatOpenPath).toHaveBeenCalledWith(
        '/path/to/file.ts',
        '10',
        '5',
        true
      );
      expect(component.copyToClipboard).toHaveBeenCalledWith('formatted/path:10:5');
    });

    it('should default to copy when no action is provided', () => {
      component.locate = true;
      component.copy = true;
      component.defaultAction = 'copy';
      component.sendType = 'xhr';

      component.trackCode();

      expect(formatOpenPath).toHaveBeenCalled();
      expect(component.copyToClipboard).toHaveBeenCalled();
      expect(component.sendXHR).not.toHaveBeenCalled();
    });

    it('should fallback to locate when copy is disabled', () => {
      component.copy = false;
      component.locate = true;
      component.defaultAction = 'copy';
      component.sendType = 'xhr';

      component.trackCode();

      expect(component.sendXHR).toHaveBeenCalled();
      expect(component.copyToClipboard).not.toHaveBeenCalled();
      expect(formatOpenPath).not.toHaveBeenCalled();
    });
  });

  describe('Combined Functionality', () => {
    it('should handle both locate and copy being true', () => {
      component.locate = true;
      component.copy = true;
      component.sendType = 'xhr';
      
      component.trackCode('all');
      
      expect(component.sendXHR).toHaveBeenCalled();
      expect(formatOpenPath).toHaveBeenCalled();
      expect(component.copyToClipboard).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined element properties', () => {
      component.copy = true;
      // @ts-ignore
      component.element = {};
      
      component.trackCode('copy');
      
      expect(formatOpenPath).toHaveBeenCalledWith(
        undefined,
        'undefined',
        'undefined',
        true
      );
    });

    it('should handle invalid sendType', () => {
      component.locate = true;
      // @ts-ignore
      component.sendType = 'invalid';
      
      component.trackCode('locate');
      
      expect(component.sendXHR).not.toHaveBeenCalled();
      expect(component.sendImg).toHaveBeenCalled();
    });
  });

  describe('Parameter Conversion', () => {
    it('should convert line and column to strings for formatOpenPath', () => {
      component.copy = true;
      component.element = {
        path: '/path/to/file.ts',
        line: 10,
        column: 5,
        name: 'test'
      };
      
      component.trackCode('copy');
      
      expect(formatOpenPath).toHaveBeenCalledWith(
        '/path/to/file.ts',
        '10',
        '5',
        true
      );
    });

    it('should handle non-numeric line and column values', () => {
      component.copy = true;
      component.element = {
        path: '/path/to/file.ts',
        // @ts-ignore
        line: 'abc',
        // @ts-ignore
        column: null,
        name: 'test'
      };
      
      component.trackCode('copy');
      
      expect(formatOpenPath).toHaveBeenCalledWith(
        '/path/to/file.ts',
        'abc',
        'null',
        true
      );
    });
  });
});
