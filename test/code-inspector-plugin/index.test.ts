import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all the plugin modules
vi.mock('@code-inspector/vite', () => ({
  ViteCodeInspectorPlugin: vi.fn(() => ({ name: 'vite-plugin' })),
}));
vi.mock('@code-inspector/webpack', () => ({
  default: vi.fn().mockImplementation(() => ({ apply: vi.fn() })),
}));
vi.mock('@code-inspector/esbuild', () => ({
  EsbuildCodeInspectorPlugin: vi.fn(() => ({ name: 'esbuild-plugin' })),
}));
vi.mock('@code-inspector/turbopack', () => ({
  TurbopackCodeInspectorPlugin: vi.fn(() => ({ key: 'turbopack-config' })),
}));
vi.mock('@code-inspector/mako', () => ({
  MakoCodeInspectorPlugin: vi.fn(() => ({ name: 'mako-plugin' })),
}));

// Mock core module before imports
vi.mock('@code-inspector/core', () => ({
  CodeOptions: {},
  fileURLToPath: vi.fn((url: string) => url.replace('file://', '')),
  getEnvVariable: vi.fn(() => 'false'),
  resetFileRecord: vi.fn(),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    red: vi.fn((s: string) => s),
  },
}));

// Mock path
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    dirname: vi.fn((p: string) => p.replace(/\/[^/]+$/, '')),
    resolve: vi.fn((...args: string[]) => args.join('/')),
  };
});

import {
  CodeInspectorPlugin,
  codeInspectorPlugin,
} from '@/code-inspector-plugin/src/index';
import { ViteCodeInspectorPlugin } from '@code-inspector/vite';
import WebpackCodeInspectorPlugin from '@code-inspector/webpack';
import { EsbuildCodeInspectorPlugin } from '@code-inspector/esbuild';
import { TurbopackCodeInspectorPlugin } from '@code-inspector/turbopack';
import { MakoCodeInspectorPlugin } from '@code-inspector/mako';
import { getEnvVariable, resetFileRecord } from '@code-inspector/core';

describe('CodeInspectorPlugin', () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('missing bundler', () => {
    it('should log error when bundler is not specified', () => {
      const result = CodeInspectorPlugin({} as any);
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should log error when options is undefined', () => {
      const result = CodeInspectorPlugin(undefined as any);
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('needEnvInspector option', () => {
    it('should set close to true by default when needEnvInspector is true', () => {
      vi.mocked(getEnvVariable).mockReturnValueOnce('false');
      const result = CodeInspectorPlugin({
        bundler: 'vite',
        needEnvInspector: true,
      });
      expect(ViteCodeInspectorPlugin).toHaveBeenCalledWith(
        expect.objectContaining({ close: true })
      );
    });

    it('should set close to false when CODE_INSPECTOR env is true', () => {
      vi.mocked(getEnvVariable).mockReturnValueOnce('true');
      const result = CodeInspectorPlugin({
        bundler: 'vite',
        needEnvInspector: true,
      });
      expect(ViteCodeInspectorPlugin).toHaveBeenCalledWith(
        expect.objectContaining({ close: false })
      );
    });
  });

  describe('bundler selection', () => {
    it('should use vite plugin for vite bundler', () => {
      CodeInspectorPlugin({ bundler: 'vite' });
      expect(ViteCodeInspectorPlugin).toHaveBeenCalled();
    });

    it('should use webpack plugin for webpack bundler', () => {
      CodeInspectorPlugin({ bundler: 'webpack' });
      expect(WebpackCodeInspectorPlugin).toHaveBeenCalled();
    });

    it('should use webpack plugin for rspack bundler', () => {
      CodeInspectorPlugin({ bundler: 'rspack' });
      expect(WebpackCodeInspectorPlugin).toHaveBeenCalled();
    });

    it('should use esbuild plugin for esbuild bundler', () => {
      CodeInspectorPlugin({ bundler: 'esbuild' });
      expect(EsbuildCodeInspectorPlugin).toHaveBeenCalled();
    });

    it('should use turbopack plugin for turbopack bundler', () => {
      CodeInspectorPlugin({ bundler: 'turbopack' });
      expect(TurbopackCodeInspectorPlugin).toHaveBeenCalled();
    });

    it('should use mako plugin for mako bundler', () => {
      CodeInspectorPlugin({ bundler: 'mako' });
      expect(MakoCodeInspectorPlugin).toHaveBeenCalled();
    });

    it('should default to vite plugin for unknown bundler', () => {
      CodeInspectorPlugin({ bundler: 'unknown' as any });
      expect(ViteCodeInspectorPlugin).toHaveBeenCalled();
    });
  });

  describe('resetFileRecord', () => {
    it('should call resetFileRecord with output path', () => {
      CodeInspectorPlugin({ bundler: 'vite' });
      expect(resetFileRecord).toHaveBeenCalled();
    });
  });

  describe('export alias', () => {
    it('should export codeInspectorPlugin as alias', () => {
      expect(codeInspectorPlugin).toBe(CodeInspectorPlugin);
    });
  });
});
