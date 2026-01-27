import { expect, describe, it, vi } from 'vitest';
import { PathName } from '@/core/src/shared/constant';
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

import { getEliminateWarningCode } from '@/core/src/server/use-client';

describe('getEliminateWarningCode', () => {
  it('should return IIFE wrapper code', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain(';(function(){');
    expect(result).toContain('})();');
  });

  it('should check for globalThis', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain("if (typeof globalThis === 'undefined' || globalThis.__code_inspector_console)");
  });

  it('should set __code_inspector_console flag', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain('globalThis.__code_inspector_console = true');
  });

  it('should include path variable with PathName', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain(`var path = "${PathName}"`);
  });

  it('should wrap console.error', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain("type: 'error'");
    expect(result).toContain('origin: console.error');
  });

  it('should wrap console.warn', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain("type: 'warn'");
    expect(result).toContain('origin: console.warn');
  });

  it('should check for Vue warning', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain('hasVueWarning');
    expect(result).toContain("args[0].indexOf(path) !== -1");
  });

  it('should check for Next.js hydrate warning', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain('hasNextWarning');
    expect(result).toContain("args[1].indexOf(path) !== -1");
  });

  it('should check for Next.js v15+ hydrate warning', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain('hasNextWarningV15');
    expect(result).toContain("args[2].indexOf(path) !== -1");
  });

  it('should call original console method when no warning detected', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain('wrapper.origin.apply(null, args)');
  });

  it('should iterate over wrappers array', () => {
    const result = getEliminateWarningCode();
    expect(result).toContain('wrappers.forEach');
    expect(result).toContain('console[wrapper.type]');
  });
});
