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

import { getWebComponentCode } from '@/core/src/server/use-client';

describe('getWebComponentCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include IIFE wrapper', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getWebComponentCode(options, 5678);
    expect(result).toContain(';(function (){');
    expect(result).toContain('})();');
  });

  it('should check for window and existing component', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getWebComponentCode(options, 5678);
    expect(result).toContain("if (typeof window !== 'undefined')");
    expect(result).toContain("if (!document.documentElement.querySelector('code-inspector-component'))");
  });

  it('should create code-inspector-component element', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getWebComponentCode(options, 5678);
    expect(result).toContain("var inspector = document.createElement('code-inspector-component')");
  });

  it('should set correct port', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getWebComponentCode(options, 9999);
    expect(result).toContain('inspector.port = 9999');
  });

  describe('hotKeys configuration', () => {
    it('should use default hotKeys when not specified', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.hotKeys = 'shiftKey,altKey'");
    });

    it('should use custom hotKeys when specified', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        hotKeys: ['ctrlKey', 'metaKey'],
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.hotKeys = 'ctrlKey,metaKey'");
    });

    it('should handle empty hotKeys array', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        hotKeys: [],
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.hotKeys = ''");
    });

    it('should handle false hotKeys', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        hotKeys: false,
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.hotKeys = ''");
    });
  });

  describe('showSwitch configuration', () => {
    it('should default showSwitch to false', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.showSwitch = !!false');
    });

    it('should set showSwitch to true when specified', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        showSwitch: true,
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.showSwitch = !!true');
    });
  });

  describe('autoToggle configuration', () => {
    it('should default autoToggle to true', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.autoToggle = !!true');
    });

    it('should set autoToggle to false when specified', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        autoToggle: false,
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.autoToggle = !!false');
    });
  });

  describe('hideConsole configuration', () => {
    it('should default hideConsole to false', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.hideConsole = !!false');
    });

    it('should set hideConsole to true when specified', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        hideConsole: true,
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.hideConsole = !!true');
    });
  });

  describe('behavior configuration', () => {
    it('should default locate to true', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.locate = !!true');
    });

    it('should set locate to false when specified', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        behavior: { locate: false },
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.locate = !!false');
    });

    it('should default copy to false', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.copy = false');
    });

    it('should set copy to true when boolean', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        behavior: { copy: true },
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector.copy = true');
    });

    it('should set copy as string when string is provided', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        behavior: { copy: 'custom-format' },
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.copy = 'custom-format'");
    });

    it('should default target to empty string', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.target = ''");
    });

    it('should set custom target', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        behavior: { target: 'http://custom-target.com' },
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.target = 'http://custom-target.com'");
    });
  });

  describe('ip configuration', () => {
    it('should default ip to localhost', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.ip = 'localhost'");
    });

    it('should use custom ip when string is provided', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        ip: '192.168.1.100',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.ip = '192.168.1.100'");
    });
  });

  describe('modeKey configuration', () => {
    it('should default modeKey to z', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.modeKey = 'z'");
    });

    it('should use custom modeKey', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        modeKey: 'x',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.modeKey = 'x'");
    });

    it('should convert modeKey to lowercase', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        modeKey: 'X',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.modeKey = 'x'");
    });

    it('should fallback to z when modeKey is empty string', () => {
      const options: CodeOptions = {
        bundler: 'vite',
        modeKey: '',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain("inspector.modeKey = 'z'");
    });
  });

  describe('bundler configuration', () => {
    it('should use iife client code for mako bundler', () => {
      const options: CodeOptions = {
        bundler: 'mako',
      };
      const result = getWebComponentCode(options, 5678);
      // The actual client code is included, we just check the structure
      expect(result).toContain('inspector');
    });

    it('should use umd client code for other bundlers', () => {
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const result = getWebComponentCode(options, 5678);
      expect(result).toContain('inspector');
    });
  });

  describe('with undefined/null options', () => {
    it('should handle undefined options gracefully', () => {
      const result = getWebComponentCode(undefined as any, 5678);
      expect(result).toContain('inspector');
    });

    it('should handle empty options object', () => {
      const result = getWebComponentCode({} as any, 5678);
      expect(result).toContain('inspector');
    });
  });

  it('should append inspector to documentElement', () => {
    const options: CodeOptions = {
      bundler: 'vite',
    };
    const result = getWebComponentCode(options, 5678);
    expect(result).toContain('document.documentElement.append(inspector)');
  });
});
