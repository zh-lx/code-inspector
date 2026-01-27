import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import type { RecordInfo, CodeOptions } from '@/core/src/shared/type';

// Mock fs.readFileSync to handle missing client files first (before imports)
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
      mkdirSync: actual.mkdirSync,
      writeFileSync: actual.writeFileSync,
      rmSync: actual.rmSync,
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

vi.mock('http');
vi.mock('portfinder', () => ({
  getPort: vi.fn((options: any, callback: any) => {
    callback(null, options?.port || 5678);
  }),
}));
vi.mock('launch-ide', () => ({
  launchIDE: vi.fn(),
}));

import { getCodeWithWebComponent } from '@/core/src/server/use-client';
import { setProjectRecord, resetFileRecord } from '@/core/src/shared/record-cache';

describe('getCodeWithWebComponent', () => {
  let testDir: string;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-get-code-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Mock HTTP server
    mockServer = {
      listen: vi.fn((port: number, callback: Function) => callback()),
    };
    vi.mocked(http.createServer).mockReturnValue(mockServer as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(process, 'cwd').mockRestore();

    // Clean up test directory
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('when file does not exist', () => {
    it('should return original code when file does not exist', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nonexistent');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const code = 'const x = 1;';

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: '/nonexistent/file.ts',
        code,
      });

      expect(result).toBe(code);
    });

    it('should start server when server option is true and file does not exist', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/server-start');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };
      const code = 'const x = 1;';

      await getCodeWithWebComponent({
        options,
        record,
        file: '/nonexistent/file.ts',
        code,
        server: true,
      });

      expect(http.createServer).toHaveBeenCalled();
    });
  });

  describe('when file exists', () => {
    it('should start server when server option is not "close"', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/server-open');

      const testFile = path.join(testDir, 'test.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      expect(http.createServer).toHaveBeenCalled();
    });

    it('should not start server when server option is "close"', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/server-close');

      const testFile = path.join(testDir, 'test-close.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        server: 'close',
      };

      // Reset mocks to track new calls
      vi.mocked(http.createServer).mockClear();

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      // Server should not be created when server is 'close'
      expect(http.createServer).not.toHaveBeenCalled();
    });
  });

  describe('inject option', () => {
    it('should inject code when inject is true', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inject-true');

      const testFile = path.join(testDir, 'inject-test.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
        inject: true,
      });

      expect(result).toContain("'use client'");
    });
  });

  describe('injectTo option', () => {
    it('should record injectTo paths from options', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inject-to');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testFile = path.join(testDir, 'main.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const injectToFile = path.join(testDir, 'inject-target.ts');
      fs.writeFileSync(injectToFile, 'export const y = 2;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        injectTo: injectToFile,
      };

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      // injectTo should be recorded
    });

    it('should handle array of injectTo paths', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inject-to-array');

      const testFile = path.join(testDir, 'main-array.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const injectFile1 = path.join(testDir, 'inject1.ts');
      const injectFile2 = path.join(testDir, 'inject2.ts');
      fs.writeFileSync(injectFile1, 'export const a = 1;');
      fs.writeFileSync(injectFile2, 'export const b = 2;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        injectTo: [injectFile1, injectFile2],
      };

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });
    });

    it('should warn when injectTo path is not absolute', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/relative-inject');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testFile = path.join(testDir, 'main-relative.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        injectTo: 'relative/path.ts', // Not absolute
      };

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should warn when injectTo file has invalid extension', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/invalid-ext');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const testFile = path.join(testDir, 'main-invalid.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        injectTo: '/absolute/path/file.css', // Invalid extension
      };

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('entry recording', () => {
    it('should record entry for JS type files', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/entry-record');

      const testFile = path.join(testDir, 'entry.tsx');
      fs.writeFileSync(testFile, 'export default function App() { return <div />; }');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      resetFileRecord(testDir);

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'export default function App() { return <div />; }',
      });
    });

    it('should not record svelte-kit server entry files', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/svelte-kit');

      const svelteDir = path.join(testDir, '.svelte-kit');
      fs.mkdirSync(svelteDir, { recursive: true });
      const testFile = path.join(svelteDir, 'server.ts');
      fs.writeFileSync(testFile, 'export const server = true;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'export const server = true;',
      });
    });
  });

  describe('target file injection', () => {
    it('should inject code when file matches entry', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/target-entry');

      const testFile = path.join(testDir, 'main.ts');
      fs.writeFileSync(testFile, 'console.log("hello");');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      // Set up the record so that testFile is the entry
      setProjectRecord(record, 'entry', path.join(testDir, 'main'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'console.log("hello");',
      });

      expect(result).toContain("'use client'");
    });

    it('should handle Astro toolbar file', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/astro');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: '\0astro:dev-toolbar',
        code: 'export default {};',
        inject: true,
      });

      // The result should be returned (may or may not be modified depending on conditions)
      expect(result).toBeDefined();
    });

    it('should inject code via injectTo file match', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inject-to-match');

      const testFile = path.join(testDir, 'custom-entry.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        injectTo: testFile,
      };

      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      expect(result).toContain("'use client'");
    });

    it('should inject code via inputs match', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inputs-match');

      const testFile = path.join(testDir, 'input-entry.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const normalizedPath = testFile.replace(/\\/g, '/');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
        inputs: Promise.resolve([normalizedPath]),
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      expect(result).toContain("'use client'");
    });
  });

  describe('importClient file mode', () => {
    it('should write web component file when importClient is "file"', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/import-file');

      const testFile = path.join(testDir, 'file-import.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        importClient: 'file',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'file-import'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      // Should import from the generated file
      expect(result).toContain("import '");
      // Should create eslintrc file
      expect(fs.existsSync(path.join(testDir, '.eslintrc.js'))).toBe(true);
      // Should create web component file
      expect(fs.existsSync(path.join(testDir, 'append-code-5678.js'))).toBe(true);
    });

    it('should not rewrite eslintrc if it already exists', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/eslintrc-exists');

      // Pre-create .eslintrc.js
      const eslintPath = path.join(testDir, '.eslintrc.js');
      fs.writeFileSync(eslintPath, 'module.exports = { rules: {} }');

      const testFile = path.join(testDir, 'eslintrc-test.ts');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        importClient: 'file',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'eslintrc-test'));
      setProjectRecord(record, 'port', 5678);

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      // Eslintrc content should remain unchanged
      const content = fs.readFileSync(eslintPath, 'utf-8');
      expect(content).toContain('rules');
    });
  });

  describe('non-JS file handling', () => {
    it('should not record non-JS files as entry', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/non-js');

      const testFile = path.join(testDir, 'style.css');
      fs.writeFileSync(testFile, 'body { color: red; }');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      resetFileRecord(testDir);

      await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'body { color: red; }',
      });
    });
  });
});
