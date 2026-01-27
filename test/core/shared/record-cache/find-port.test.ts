import { findPort, setProjectRecord, resetFileRecord } from '@/core/src/shared/record-cache';
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { RecordInfo } from '@/core/src/shared/type';

describe('findPort', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `test-find-port-${Date.now()}`);
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

  describe('when port exists in file record', () => {
    it('should return port from file record', async () => {
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

      const port = await findPort(record);

      expect(port).toBe(5678);
    });

    it('should return port from different project', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/another/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/another/project': {
          port: 9999,
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      const port = await findPort(record);

      expect(port).toBe(9999);
    });
  });

  describe('when port exists in memory cache', () => {
    it('should return port from memory cache', async function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/memory/cache/project');

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'readonly');
      fs.mkdirSync(readOnlyDir);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: readOnlyDir,
      };

      // Set port in memory cache via setProjectRecord
      setProjectRecord(record, 'port', 7777);

      // Now make it read-only
      fs.chmodSync(readOnlyDir, 0o555);

      const port = await findPort(record);

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);

      expect(port).toBe(7777);
    });
  });

  describe('when port does not exist initially', () => {
    it('should wait and retry until port is set', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/waiting/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Start findPort which will wait
      const findPortPromise = findPort(record);

      // After a short delay, set the port
      setTimeout(() => {
        setProjectRecord(record, 'port', 8888);
      }, 50);

      const port = await findPortPromise;

      expect(port).toBe(8888);
    });

    it('should keep retrying until port is available', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/retry/project');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Set port to 0 initially (falsy)
      setProjectRecord(record, 'port', 0);

      // Start findPort which will retry
      const findPortPromise = findPort(record);

      // After delays, set port to a valid value
      setTimeout(() => {
        setProjectRecord(record, 'port', 6666);
      }, 100);

      const port = await findPortPromise;

      expect(port).toBe(6666);
    });
  });

  describe('when record file has invalid JSON', () => {
    it('should wait and retry using memory cache', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/invalid/json/project');

      const recordFilePath = path.join(testDir, 'record.json');
      fs.writeFileSync(recordFilePath, 'invalid json', 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Start findPort
      const findPortPromise = findPort(record);

      // Set port after a delay (will be written to the file, fixing it)
      setTimeout(() => {
        setProjectRecord(record, 'port', 5555);
      }, 50);

      const port = await findPortPromise;

      expect(port).toBe(5555);
    });
  });

  describe('when port is in RecordCache but file has no port', () => {
    it('should return port from RecordCache when file is writable but has no port entry', async function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/recordcache/fallback/project');

      // Create a directory that we'll toggle permissions on
      const toggleDir = path.join(testDir, 'toggle-perm');
      fs.mkdirSync(toggleDir);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: toggleDir,
      };

      // Step 1: Make directory read-only
      fs.chmodSync(toggleDir, 0o555);

      // Step 2: Set port in RecordCache (since dir is read-only, it goes to memory cache)
      setProjectRecord(record, 'port', 2222);

      // Step 3: Restore write permission (now file is writable)
      fs.chmodSync(toggleDir, 0o755);

      // Step 4: File now exists but has no port for this project OR file doesn't exist
      // Either way, content[projectDir]?.port will be falsy
      // But RecordCache[projectDir]?.port is 2222

      const port = await findPort(record);

      expect(port).toBe(2222);
    });
  });

  describe('edge cases', () => {
    it('should handle port value of 0 as falsy and keep waiting', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue('/zero/port/project');

      const recordFilePath = path.join(testDir, 'record.json');
      const existingContent = {
        '/zero/port/project': {
          port: 0,
        },
      };
      fs.writeFileSync(recordFilePath, JSON.stringify(existingContent, null, 2), 'utf-8');

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: testDir,
      };

      // Start findPort
      const findPortPromise = findPort(record);

      // Update the port to a valid value after a delay
      setTimeout(() => {
        const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
        content['/zero/port/project'].port = 4444;
        fs.writeFileSync(recordFilePath, JSON.stringify(content, null, 2), 'utf-8');
      }, 50);

      const port = await findPortPromise;

      expect(port).toBe(4444);
    });

    it('should return port from memory cache when file is not writable', async function() {
      // Skip on Windows as chmod doesn't work the same way
      if (process.platform === 'win32') {
        this.skip();
      }

      vi.spyOn(process, 'cwd').mockReturnValue('/cache/fallback/project');

      // Create a read-only directory
      const readOnlyDir = path.join(testDir, 'cache-fallback');
      fs.mkdirSync(readOnlyDir);

      const record: RecordInfo = {
        port: 0,
        entry: '',
        output: readOnlyDir,
      };

      // Reset file record to initialize memory cache
      resetFileRecord(readOnlyDir);

      // Make directory read-only
      fs.chmodSync(readOnlyDir, 0o555);

      // Start findPort
      const findPortPromise = findPort(record);

      // Set port in memory cache after a delay
      setTimeout(() => {
        // Temporarily restore write permission to set port
        fs.chmodSync(readOnlyDir, 0o755);
        setProjectRecord(record, 'port', 3333);
        fs.chmodSync(readOnlyDir, 0o555);
      }, 50);

      const port = await findPortPromise;

      // Restore permissions for cleanup
      fs.chmodSync(readOnlyDir, 0o755);

      expect(port).toBe(3333);
    });
  });
});
