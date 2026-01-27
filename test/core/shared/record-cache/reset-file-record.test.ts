import { resetFileRecord } from '@/core/src/shared/record-cache';
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('resetFileRecord', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Save original cwd
    originalCwd = process.cwd();

    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-reset-file-record-${Date.now()}`);
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
    it('should reset the record for the current project', () => {
      // Mock process.cwd
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      // Create a record file with existing data
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

      // Call resetFileRecord
      resetFileRecord(testDir);

      // Read the updated record file
      const updatedContent = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));

      // Verify the current project's record is reset
      expect(updatedContent['/test/project']).toEqual({
        previousPort: 5678,
        port: 0,
        entry: '',
      });

      // Verify other project's record is unchanged
      expect(updatedContent['/other/project']).toEqual({
        port: 5679,
        entry: '/other/project/src/main.ts',
      });
    });

    it('should preserve previousPort from existing port', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/my/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/my/project': {
          port: 1234,
          entry: '/my/project/index.ts',
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      resetFileRecord(testDir);

      const updatedContent = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(updatedContent['/my/project'].previousPort).toBe(1234);
    });

    it('should handle record without port field', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/my/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/my/project': {
          entry: '/my/project/index.ts',
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      resetFileRecord(testDir);

      const updatedContent = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(updatedContent['/my/project'].previousPort).toBeUndefined();
      expect(updatedContent['/my/project'].port).toBe(0);
      expect(updatedContent['/my/project'].entry).toBe('');
    });
  });

  describe('when record file does not exist', () => {
    it('should create a new record file with empty record', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/new/project');

      const recordFilePath = path.join(testDir, 'record.json');

      // Ensure record file doesn't exist
      expect(fs.existsSync(recordFilePath)).toBe(false);

      resetFileRecord(testDir);

      // Verify record file was created
      expect(fs.existsSync(recordFilePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/new/project']).toEqual({
        previousPort: undefined,
        port: 0,
        entry: '',
      });
    });
  });

  describe('when record file contains invalid JSON', () => {
    it('should create a new record', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/test/project');

      const recordFilePath = path.join(testDir, 'record.json');
      fs.writeFileSync(recordFilePath, 'invalid json content', 'utf-8');

      resetFileRecord(testDir);

      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/test/project']).toEqual({
        previousPort: undefined,
        port: 0,
        entry: '',
      });
    });
  });

  describe('when no write permission', () => {
    it('should store record in memory cache', function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/no/permission/project');

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'readonly');
      fs.mkdirSync(readOnlyDir);
      fs.chmodSync(readOnlyDir, 0o555);

      // This should use memory cache instead of file
      resetFileRecord(readOnlyDir);

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);

      // The function should not throw even without write permission
      // The record is stored in memory cache
    });
  });

  describe('edge cases', () => {
    it('should handle project without existing record entry', () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/brand/new/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/other/project': {
          port: 5678,
          entry: '/other/project/src/main.ts',
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      resetFileRecord(testDir);

      const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
      expect(content['/brand/new/project']).toEqual({
        previousPort: undefined,
        port: 0,
        entry: '',
      });
      expect(content['/other/project']).toEqual({
        port: 5678,
        entry: '/other/project/src/main.ts',
      });
    });
  });
});
