// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeInspectorComponent } from '@/core/src/client';

describe('buildTargetUrl', () => {
  let component: CodeInspectorComponent;

  beforeEach(() => {
    component = new CodeInspectorComponent();
    document.body.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(component);
    vi.clearAllMocks();
  });

  describe('Basic Replacement', () => {
    it('should replace {file} with element path', () => {
      component.target = 'https://example.com/open?file={file}';
      component.element = {
        name: 'div',
        path: '/path/to/file.ts',
        line: 10,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/open?file=/path/to/file.ts');
    });

    it('should replace {line} with element line', () => {
      component.target = 'https://example.com/open?line={line}';
      component.element = {
        name: 'div',
        path: '/path/to/file.ts',
        line: 42,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/open?line=42');
    });

    it('should replace {column} with element column', () => {
      component.target = 'https://example.com/open?column={column}';
      component.element = {
        name: 'div',
        path: '/path/to/file.ts',
        line: 10,
        column: 15
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/open?column=15');
    });
  });

  describe('Multiple Replacements', () => {
    it('should replace all placeholders in a single URL', () => {
      component.target = 'https://example.com/open?file={file}&line={line}&column={column}';
      component.element = {
        name: 'div',
        path: '/src/components/App.tsx',
        line: 100,
        column: 20
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/open?file=/src/components/App.tsx&line=100&column=20');
    });

    it('should replace multiple occurrences of the same placeholder', () => {
      component.target = 'https://example.com/{file}/edit/{file}';
      component.element = {
        name: 'div',
        path: '/src/file.ts',
        line: 10,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com//src/file.ts/edit//src/file.ts');
    });
  });

  describe('Edge Cases', () => {
    it('should return target unchanged if no placeholders', () => {
      component.target = 'https://example.com/static-url';
      component.element = {
        name: 'div',
        path: '/path/to/file.ts',
        line: 10,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/static-url');
    });

    it('should handle empty target', () => {
      component.target = '';
      component.element = {
        name: 'div',
        path: '/path/to/file.ts',
        line: 10,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('');
    });

    it('should handle special characters in file path', () => {
      component.target = 'https://example.com/?file={file}';
      component.element = {
        name: 'div',
        path: '/path/with spaces/file.ts',
        line: 10,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/?file=/path/with spaces/file.ts');
    });

    it('should handle line and column with zero values', () => {
      component.target = 'https://example.com/?line={line}&column={column}';
      component.element = {
        name: 'div',
        path: '/path/file.ts',
        line: 0,
        column: 0
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://example.com/?line=0&column=0');
    });
  });

  describe('IDE Integration URLs', () => {
    it('should handle vscode:// URL format', () => {
      component.target = 'vscode://file/{file}:{line}:{column}';
      component.element = {
        name: 'div',
        path: '/Users/dev/project/src/App.tsx',
        line: 25,
        column: 10
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('vscode://file//Users/dev/project/src/App.tsx:25:10');
    });

    it('should handle GitHub URL format', () => {
      component.target = 'https://github.com/user/repo/blob/main{file}#L{line}';
      component.element = {
        name: 'div',
        path: '/src/components/Button.tsx',
        line: 42,
        column: 5
      };

      const result = component.buildTargetUrl();

      expect(result).toBe('https://github.com/user/repo/blob/main/src/components/Button.tsx#L42');
    });
  });
});
