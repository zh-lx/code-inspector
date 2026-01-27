import { setProjectRecord, getProjectRecord } from '@/core/src/shared/record-cache';
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { RecordInfo } from '@/core/src/shared/type';

describe('setProjectRecord', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-set-project-record-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Restore original cwd
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

  describe('when record file exists', () => {
    it('should update an existing record field', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/test/project': {
          port: 5678,
          entry: '/test/project/src/main.ts',
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'port', 9999);

      const updatedContent = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(updatedContent['/test/project'].port).toBe(9999);
      expect(updatedContent['/test/project'].entry).toBe('/test/project/src/main.ts');
    });

    it('should add a new field to existing record', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/test/project': {
          port: 5678,
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'entry', '/test/project/src/index.ts');

      const updatedContent = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(updatedContent['/test/project'].port).toBe(5678);
      expect(updatedContent['/test/project'].entry).toBe('/test/project/src/index.ts');
    });

    it('should preserve other projects records', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/test/project': {
          port: 5678,
        },
        '/other/project': {
          port: 1234,
          entry: '/other/project/main.ts',
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'port', 8888);

      const updatedContent = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(updatedContent['/test/project'].port).toBe(8888);
      expect(updatedContent['/other/project']).toEqual({
        port: 1234,
        entry: '/other/project/main.ts',
      });
    });
  });

  describe('when record file does not exist', () => {
    it('should create new record file with project record', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/new/project');

      const recordFilePath = path.join(testDir, 'record.json');
      expect(fs.existsSync(recordFilePath)).toBe(false);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'port', 5678);

      expect(fs.existsSync(recordFilePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/new/project'].port).toBe(5678);
    });
  });

  describe('when project has no existing record', () => {
    it('should create new record for project', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/brand/new/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/other/project': {
          port: 1234,
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'entry', '/brand/new/project/main.ts');

      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/brand/new/project']).toEqual({
        entry: '/brand/new/project/main.ts',
      });
      expect(content['/other/project']).toEqual({
        port: 1234,
      });
    });
  });

  describe('when record file contains invalid JSON', () => {
    it('should create new record', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      fs.writeFileSync(recordFilePath, 'invalid json', 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'port', 5678);

      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/test/project'].port).toBe(5678);
    });
  });

  describe('when no write permission', () => {
    it('should store record in memory cache', function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/no/write/permission/project');

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'readonly');
      fs.mkdirSync(readOnlyDir);
      fs.chmodSync(readOnlyDir, 0o555);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: readOnlyDir,
      };

      // This should use memory cache instead of file
      setProjectRecord(record, 'port', 5678);

      // Verify using getProjectRecord
      const result = getProjectRecord(record);

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);

      expect(result?.port).toBe(5678);
    });
  });

  describe('different record fields', () => {
    it('should set port field', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'port', 9999);

      const recordFilePath = path.join(testDir, 'record.json');
      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/test/project'].port).toBe(9999);
    });

    it('should set entry field', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'entry', '/test/project/src/main.ts');

      const recordFilePath = path.join(testDir, 'record.json');
      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/test/project'].entry).toBe('/test/project/src/main.ts');
    });

    it('should set output field', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'output', '/custom/output/dir');

      const recordFilePath = path.join(testDir, 'record.json');
      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/test/project'].output).toBe('/custom/output/dir');
    });

    it('should set previousPort field', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      setProjectRecord(record, 'previousPort', 1234);

      const recordFilePath = path.join(testDir, 'record.json');
      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/test/project'].previousPort).toBe(1234);
    });
  });
});
