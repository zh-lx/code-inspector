import { describe, it, expect, vi } from 'vitest';
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
      existsSync: vi.fn((filePath: string) => {
        if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
          return true;
        }
        return actual.existsSync(filePath);
      }),
    },
    readFileSync: vi.fn((filePath: string, encoding?: string) => {
      if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
        return '// mocked client code';
      }
      return actual.readFileSync(filePath, encoding as BufferEncoding);
    }),
    existsSync: vi.fn((filePath: string) => {
      if (typeof filePath === 'string' && (filePath.includes('client.umd.js') || filePath.includes('client.iife.js'))) {
        return true;
      }
      return actual.existsSync(filePath);
    }),
  };
});

describe('core/src/index exports', () => {
  it('should export parseSFC from @vue/compiler-sfc', async () => {
    const { parseSFC } = await import('@/core/src/index');
    expect(typeof parseSFC).toBe('function');
  });

  it('should export getEnvVariable from launch-ide', async () => {
    const { getEnvVariable } = await import('@/core/src/index');
    expect(typeof getEnvVariable).toBe('function');
  });

  it('should export server functions', async () => {
    const exports = await import('@/core/src/index');
    // From server/index.ts
    expect(typeof exports.transformCode).toBe('function');
    // From use-client.ts
    expect(typeof exports.getCodeWithWebComponent).toBe('function');
    expect(typeof exports.getInjectedCode).toBe('function');
    expect(typeof exports.getWebComponentCode).toBe('function');
    expect(typeof exports.getEliminateWarningCode).toBe('function');
    expect(typeof exports.getHidePathAttrCode).toBe('function');
    expect(typeof exports.isNextjsProject).toBe('function');
    expect(typeof exports.isNextGET16).toBe('function');
    expect(typeof exports.clientJsPath).toBe('string');
    // From server.ts
    expect(typeof exports.createServer).toBe('function');
    expect(typeof exports.startServer).toBe('function');
    expect(typeof exports.getRelativePath).toBe('function');
    expect(typeof exports.getRelativeOrAbsolutePath).toBe('function');
  });

  it('should export shared utilities', async () => {
    const exports = await import('@/core/src/index');
    // From shared/index.ts
    expect(typeof exports.getIP).toBe('function');
    expect(typeof exports.fileURLToPath).toBe('function');
    expect(typeof exports.isJsTypeFile).toBe('function');
    expect(typeof exports.getFilePathWithoutExt).toBe('function');
    expect(typeof exports.normalizePath).toBe('function');
    expect(typeof exports.isEscapeTags).toBe('function');
    expect(typeof exports.getDependenciesMap).toBe('function');
    expect(typeof exports.getDependencies).toBe('function');
    expect(typeof exports.isDev).toBe('function');
    expect(typeof exports.matchCondition).toBe('function');
    expect(typeof exports.getMappingFilePath).toBe('function');
    expect(typeof exports.isExcludedFile).toBe('function');
    expect(typeof exports.hasWritePermission).toBe('function');
  });

  it('should export shared constants', async () => {
    const exports = await import('@/core/src/index');
    expect(typeof exports.PathName).toBe('string');
    expect(typeof exports.DefaultPort).toBe('number');
    expect(Array.isArray(exports.JsFileExtList)).toBe(true);
    expect(typeof exports.AstroToolbarFile).toBe('string');
  });

  it('should export record cache functions', async () => {
    const exports = await import('@/core/src/index');
    expect(typeof exports.resetFileRecord).toBe('function');
    expect(typeof exports.getProjectRecord).toBe('function');
    expect(typeof exports.setProjectRecord).toBe('function');
    expect(typeof exports.findPort).toBe('function');
  });
});
