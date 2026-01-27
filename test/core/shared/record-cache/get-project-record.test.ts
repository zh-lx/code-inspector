import { getProjectRecord, resetFileRecord } from '@/core/src/shared/record-cache';
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { RecordInfo } from '@/core/src/shared/type';

describe('getProjectRecord', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-get-project-record-${Date.now()}`);
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
    it('should return the project record from file', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/test/project': {
          port: 5678,
          entry: '/test/project/src/main.ts',
        },
        '/other/project': {
          port: 5679,
          entry: '/other/project/src/main.ts',
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      const result = getProjectRecord(record);

      expect(result).toEqual({
        port: 5678,
        entry: '/test/project/src/main.ts',
      });
    });

    it('should return undefined when project has no record', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/nonexistent/project');

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

      const result = getProjectRecord(record);

      expect(result).toBeUndefined();
    });
  });

  describe('when record file does not exist', () => {
    it('should return undefined', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      const result = getProjectRecord(record);

      expect(result).toBeUndefined();
    });
  });

  describe('when record file contains invalid JSON', () => {
    it('should return undefined', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      fs.writeFileSync(recordFilePath, 'invalid json content', 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      const result = getProjectRecord(record);

      expect(result).toBeUndefined();
    });
  });

  describe('when no write permission', () => {
    it('should return record from memory cache', function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/no/permission/project');

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'readonly');
      fs.mkdirSync(readOnlyDir);

      // First reset the record to put something in the memory cache
      resetFileRecord(readOnlyDir);

      // Now make it read-only
      fs.chmodSync(readOnlyDir, 0o555);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: readOnlyDir,
      };

      const result = getProjectRecord(record);

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);

      // Should return the record from memory cache
      expect(result).toEqual({
        previousPort: undefined,
        port: 0,
        entry: '',
      });
    });

    it('should return undefined from memory cache when no record exists', function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/fresh/no/permission/project');

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'readonly-fresh');
      fs.mkdirSync(readOnlyDir);
      fs.chmodSync(readOnlyDir, 0o555);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: readOnlyDir,
      };

      const result = getProjectRecord(record);

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);

      // Should return undefined as there's nothing in memory cache
      expect(result).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty record object for project', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/empty/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/empty/project': {},
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      const result = getProjectRecord(record);

      expect(result).toEqual({});
    });

    it('should handle record with partial data', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/partial/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/partial/project': {
          port: 5678,
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      const result = getProjectRecord(record);

      expect(result).toEqual({
        port: 5678,
      });
    });
  });
});
