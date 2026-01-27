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

import { getHidePathAttrCode } from '@/core/src/server/use-client';

describe('getHidePathAttrCode', () => {
  it('should return IIFE wrapper code', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain(';(function(){');
    expect(result).toContain('})();');
  });

  it('should check for window and observed flag', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain("if (typeof window === 'undefined' || window.__code_inspector_observed)");
  });

  it('should set __code_inspector_observed flag', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain('window.__code_inspector_observed = true');
  });

  it('should define observe function', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain('function observe()');
  });

  it('should query elements with PathName attribute', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain(`document.querySelectorAll("[${PathName}]")`);
  });

  it('should move attribute value to element property', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain(`node["${PathName}"] = node.getAttribute("${PathName}")`);
  });

  it('should remove PathName attribute from DOM', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain(`node.removeAttribute("${PathName}")`);
  });

  it('should iterate over all matching nodes', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain('.forEach((node)');
  });

  it('should call observe function', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain('observe();');
  });

  it('should set timeout for recursive observation', () => {
    const result = getHidePathAttrCode();
    expect(result).toContain('setTimeout(observe, 1000)');
  });
});
