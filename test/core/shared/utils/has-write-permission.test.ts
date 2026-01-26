import { hasWritePermission } from '@/core/src/shared/utils';
import { expect, describe, it, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('hasWritePermission', () => {
  let testDir: string;
  let testFile: string;
  let readOnlyFile: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-write-perm-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Create a writable test file
    testFile = path.join(testDir, 'writable.txt');
    fs.writeFileSync(testFile, 'test content');

    // Create a read-only file (except on Windows, where this is more complex)
    if (process.platform !== 'win32') {
      readOnlyFile = path.join(testDir, 'readonly.txt');
      fs.writeFileSync(readOnlyFile, 'readonly content');
      fs.chmodSync(readOnlyFile, 0o444); // read-only
    }
  });

  afterEach(() => {
    // Clean up test files and directory
    try {
      if (readOnlyFile && fs.existsSync(readOnlyFile)) {
        // Restore write permission before deleting
        fs.chmodSync(readOnlyFile, 0o644);
        fs.unlinkSync(readOnlyFile);
      }
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('file exists', () => {
    it('should return true for writable file', () => {
      expect(hasWritePermission(testFile)).toBe(true);
    });

    it('should return false for read-only file', function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }
      expect(hasWritePermission(readOnlyFile)).toBe(false);
    });

    it('should return true for writable directory', () => {
      expect(hasWritePermission(testDir)).toBe(true);
    });
  });

  describe('file does not exist', () => {
    it('should return true if parent directory is writable', () => {
      const nonExistentFile = path.join(testDir, 'non-existent.txt');
      expect(hasWritePermission(nonExistentFile)).toBe(true);
    });

    it('should return false if parent directory does not exist', () => {
      const nonExistentPath = path.join(testDir, 'non-existent-dir', 'file.txt');
      expect(hasWritePermission(nonExistentPath)).toBe(false);
    });

    it('should return false if parent directory is not writable', function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'readonly-dir');
      fs.mkdirSync(readOnlyDir);
      fs.chmodSync(readOnlyDir, 0o555); // read and execute only

      const fileInReadOnlyDir = path.join(readOnlyDir, 'file.txt');
      const result = hasWritePermission(fileInReadOnlyDir);

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);
      fs.rmdirSync(readOnlyDir);

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested non-existent paths', () => {
      const deepPath = path.join(testDir, 'a', 'b', 'c', 'd', 'file.txt');
      expect(hasWritePermission(deepPath)).toBe(false);
    });

    it('should return true for writable file in writable directory', () => {
      const newFile = path.join(testDir, 'new-file.txt');
      // File doesn't exist yet, but directory is writable
      expect(hasWritePermission(newFile)).toBe(true);

      // Create the file
      fs.writeFileSync(newFile, 'content');

      // File exists and is writable
      expect(hasWritePermission(newFile)).toBe(true);

      // Cleanup
      fs.unlinkSync(newFile);
    });

    it('should handle special characters in file path', () => {
      const specialFile = path.join(testDir, 'file with spaces & special!.txt');
      expect(hasWritePermission(specialFile)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle invalid path gracefully', () => {
      // On some systems, null bytes in paths may not cause errors
      // This test just ensures the function doesn't throw
      const invalidPath = '/path/with\0null/byte';
      expect(() => hasWritePermission(invalidPath)).not.toThrow();
    });

    it('should check current directory for empty string path', () => {
      // Empty string resolves to current directory
      // The result depends on whether cwd is writable
      const result = hasWritePermission('');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for non-existent deeply nested path', () => {
      const deepPath = '/non/existent/very/deep/path/that/does/not/exist';
      expect(hasWritePermission(deepPath)).toBe(false);
    });
  });
});
