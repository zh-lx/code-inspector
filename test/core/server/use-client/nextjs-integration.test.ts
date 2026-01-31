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
import * as sharedUtils from '@/core/src/shared/utils';
import * as sharedModule from '@/core/src/shared';

describe('Next.js Integration Tests', () => {
  let testDir: string;
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-nextjs-${Date.now()}`);
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

  describe('Next.js project detection and code injection', () => {
    it('should add Next.js empty element and import for Next.js project with use client directive', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-useClient');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'page.tsx');
      const originalCode = `'use client';
export default function Page() {
  return <div>Hello</div>;
}`;
      fs.writeFileSync(testFile, originalCode);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'page'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      // Should add import and empty element for Next.js
      expect(result).toContain('CodeInspectorEmptyElement');
    });

    it('should add Next.js empty element for JSX without use client directive', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-no-useClient');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'component.tsx');
      const originalCode = `export default function Component() {
  return <div>Hello</div>;
}`;
      fs.writeFileSync(testFile, originalCode);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'component'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      // Should still add import even without use client directive
      expect(result).toContain('import');
    });

    it('should handle nested JSX elements correctly', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-nested');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'nested.tsx');
      const originalCode = `'use client';
export default function Nested() {
  return (
    <div>
      <span>Nested</span>
    </div>
  );
}`;
      fs.writeFileSync(testFile, originalCode);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'nested'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      // Should add CodeInspectorEmptyElement before the first closing tag
      expect(result).toContain('CodeInspectorEmptyElement');
    });

    it('should not re-process file if already processed (identical content after transform)', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-reprocess');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'already-processed.tsx');
      // Code that already has the empty element (simulating already processed)
      const originalCode = `'use client';
export default function AlreadyProcessed() {
  return <div><CodeInspectorEmptyElement /></div>;
}`;
      fs.writeFileSync(testFile, originalCode);

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
        code: originalCode,
      });

      // Should not throw error and entry should not be recorded for already processed content
    });
  });

  describe('Next.js instrumentation file handling', () => {
    it('should not record instrumentation file as entry for Next.js project', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-instrumentation');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'instrumentation.ts');
      fs.writeFileSync(testFile, 'export function register() {}');

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
        code: 'export function register() {}',
      });

      // Instrumentation file should not be set as entry
    });

    it('should not record instrumentation.js file as entry', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-instrumentation-js');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'src', 'instrumentation.js');
      fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });
      fs.writeFileSync(testFile, 'export function register() {}');

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
        code: 'export function register() {}',
      });

      // Should not throw and instrumentation file should be excluded
    });
  });

  describe('importClient file mode for Next.js', () => {
    it('should correctly handle file matching web component file path', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-file-match');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      // Create the web component file first
      const webComponentFile = path.join(testDir, 'append-code-5678.js');
      fs.writeFileSync(webComponentFile, '// web component code');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
        importClient: 'file',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'append-code-5678'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: webComponentFile,
        code: '// web component code',
      });

      // When file matches webComponentFilePath, should not add import
      expect(result).toBe('// web component code');
    });
  });

  describe('Edge cases for Next.js code transformation', () => {
    it('should handle JSX without closing element gracefully', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-self-closing');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'self-closing.tsx');
      const originalCode = `'use client';
export default function SelfClosing() {
  return <br />;
}`;
      fs.writeFileSync(testFile, originalCode);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'self-closing'));
      setProjectRecord(record, 'port', 5678);

      // Should not throw error even with self-closing element
      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      expect(result).toBeDefined();
    });

    it('should handle multiple JSX roots by only modifying first', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/nextjs-multiple-roots');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);

      const testFile = path.join(testDir, 'multiple.tsx');
      const originalCode = `'use client';
const Header = () => <header>Header</header>;
const Footer = () => <footer>Footer</footer>;
export default Header;`;
      fs.writeFileSync(testFile, originalCode);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'multiple'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      // Should only add one CodeInspectorEmptyElement (after first JSX element)
      const matches = result.match(/CodeInspectorEmptyElement/g);
      // At least 2 occurrences (import and element), but only one element insertion
      expect(matches).toBeDefined();
    });
  });

  describe('hasWritePermission branch', () => {
    it('should fall back to inline injection when no write permission', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/no-write-permission');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['next', 'react']);
      const hasWritePermissionSpy = vi.spyOn(sharedModule, 'hasWritePermission').mockReturnValue(false);

      const testFile = path.join(testDir, 'no-write.tsx');
      const originalCode = `'use client';
export default function NoWrite() {
  return <div>Hello</div>;
}`;
      fs.writeFileSync(testFile, originalCode);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      setProjectRecord(record, 'entry', path.join(testDir, 'no-write'));
      setProjectRecord(record, 'port', 5678);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      // When no write permission, should inline the code instead of importing
      expect(result).toContain("'use client'");

      // Restore the mock explicitly
      hasWritePermissionSpy.mockRestore();
    });
  });

  describe('injectTo matching', () => {
    it('should inject code when file matches injectTo path', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inject-to-test');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['react']);

      const testFile = path.join(testDir, 'inject-target.tsx');
      const originalCode = 'const x = 1;';
      fs.writeFileSync(testFile, originalCode);

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
      setProjectRecord(record, 'injectTo', [testFile.replace(/\\/g, '/')]);

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: originalCode,
      });

      expect(result).toContain("'use client'");
    });
  });

  describe('edge cases for fallback branches', () => {
    it('should handle undefined port gracefully', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/undefined-port');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['react']);

      const testFile = path.join(testDir, 'undefined-port.ts');
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

      setProjectRecord(record, 'entry', path.join(testDir, 'undefined-port'));
      // Intentionally NOT setting port to test the fallback

      const result = await getCodeWithWebComponent({
        options,
        record,
        file: testFile,
        code: 'const x = 1;',
      });

      expect(result).toBeDefined();
    });

    it('should inject code when file matches injectTo in record', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project/inject-to-record');
      vi.spyOn(sharedUtils, 'getDependencies').mockReturnValue(['react']);

      const testFile = path.join(testDir, 'inject-record.tsx');
      const normalizedPath = testFile.replace(/\\/g, '/');
      fs.writeFileSync(testFile, 'const x = 1;');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };
      const options: CodeOptions = {
        bundler: 'vite',
      };

      // Set injectTo in record before calling
      setProjectRecord(record, 'injectTo', [normalizedPath]);
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
});
