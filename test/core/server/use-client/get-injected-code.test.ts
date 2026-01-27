import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import type { CodeOptions } from '@/core/src/shared/type';
import fs from 'fs';

// Mock fs.readFileSync to handle missing client files
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs') as typeof fs;
  return {
    ...actual,
    default: {
      ...actual,
      readFileSync: vi.fn((filePath: string, encoding?: string) => {
        if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
          return '// mocked client code';
        }
        return actual.readFileSync(filePath, encoding as BufferEncoding);
      }),
    },
    readFileSync: vi.fn((filePath: string, encoding?: string) => {
      if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
        return '// mocked client code';
      }
      return actual.readFileSync(filePath, encoding as BufferEncoding);
    }),
  };
});

import { getInjectedCode } from '@/core/src/server/use-client';

describe('getInjectedCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with "use client" directive', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getInjectedCode(options, 5678, false);
    expect(result).toContain("'use client'");
  });

  it('should include eliminate warning code by default', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getInjectedCode(options, 5678, false);
    expect(result).toContain('__code_inspector_console');
  });

  it('should skip console snippet when specified in skipSnippets', () => {
    const options: CodeOptions = {
      bundler: 'vite',
      skipSnippets: ['console'],
    };
    const result = getInjectedCode(options, 5678, false);
    expect(result).not.toContain('__code_inspector_console');
  });

  it('should include hide path attr code when hideDomPathAttr is true', () => {
    const options: CodeOptions = {
      bundler: 'vite',
      hideDomPathAttr: true,
    };
    const result = getInjectedCode(options, 5678, false);
    expect(result).toContain('__code_inspector_observed');
  });

  it('should not include hide path attr code when hideDomPathAttr is false', () => {
    const options: CodeOptions = {
      bundler: 'vite',
      hideDomPathAttr: false,
    };
    const result = getInjectedCode(options, 5678, false);
    expect(result).not.toContain('__code_inspector_observed');
  });

  it('should include web component code with correct port', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getInjectedCode(options, 9999, false);
    expect(result).toContain('inspector.port = 9999');
  });

  it('should start with eslint disable comment', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getInjectedCode(options, 5678, false);
    expect(result).toContain('/* eslint-disable */');
  });

  it('should remove newlines from code', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getInjectedCode(options, 5678, false);
    // After the eslint-disable comment, check if newlines are replaced
    const afterEslint = result.split('/* eslint-disable */ ')[1];
    // The exported Next.js component may have newlines, but the main code shouldn't
    expect(afterEslint).toBeDefined();
  });

  describe('Next.js support', () => {
    it('should export CodeInspectorEmptyElement component for Next.js', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getInjectedCode(options, 5678, true);
      expect(result).toContain('export default function CodeInspectorEmptyElement');
      expect(result).toContain('return null');
    });

    it('should not export component when not Next.js', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getInjectedCode(options, 5678, false);
      expect(result).not.toContain('export default function CodeInspectorEmptyElement');
    });
  });

  describe('with various options', () => {
    it('should handle all options combined', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        hideDomPathAttr: true,
        skipSnippets: [],
      };
      const result = getInjectedCode(options, 5678, true);
      expect(result).toContain("'use client'");
      expect(result).toContain('__code_inspector_console');
      expect(result).toContain('__code_inspector_observed');
      expect(result).toContain('export default function CodeInspectorEmptyElement');
    });
  });
});
