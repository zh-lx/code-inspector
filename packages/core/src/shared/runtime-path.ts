import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

export const SERVER_PROTOCOL_VERSION = 1;

let temporaryFileSequence = 0;

function getUserId() {
  const value =
    typeof process.getuid === 'function'
      ? String(process.getuid())
      : process.env.USERNAME || process.env.USER || 'default';
  return value.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

function ensurePrivateDirectory(directory: string) {
  try {
    fs.mkdirSync(directory, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }

  const stat = fs.lstatSync(directory);
  // Reject symlinks so runtime files cannot be redirected to an unexpected location.
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Unsafe code-inspector runtime directory: ${directory}`);
  }

  if (process.platform !== 'win32' && typeof process.getuid === 'function') {
    if (stat.uid !== process.getuid()) {
      throw new Error(
        `The code-inspector runtime directory is not owned by the current user: ${directory}`,
      );
    }
    if ((stat.mode & 0o077) !== 0) {
      fs.chmodSync(directory, 0o700);
    }
  }
}

export function getProjectId() {
  return crypto.createHash('sha256').update(process.cwd()).digest('hex');
}

export function getRuntimeDirectory(output: string) {
  // Isolate runtime state by user, project, output target, and protocol version.
  const identity = `${process.cwd()}\0${path.resolve(output)}\0${SERVER_PROTOCOL_VERSION}`;
  return path.join(
    os.tmpdir(),
    `code-inspector-plugin-${getUserId()}`,
    crypto.createHash('sha256').update(identity).digest('hex'),
  );
}

export function ensureRuntimeDirectory(output: string) {
  const directory = getRuntimeDirectory(output);
  ensurePrivateDirectory(path.dirname(directory));
  ensurePrivateDirectory(directory);
  return directory;
}

export function getBuildStateFilePath(output: string) {
  return path.join(getRuntimeDirectory(output), 'build-state.json');
}

export function getServerStateFilePath(output: string) {
  return path.join(getRuntimeDirectory(output), 'server.json');
}

export function readRuntimeJsonFile<T>(filePath: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return undefined;
  }
}

export function writeRuntimeJsonFile<T>(
  output: string,
  filePath: string,
  content: T,
) {
  ensureRuntimeDirectory(output);
  temporaryFileSequence += 1;
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.${temporaryFileSequence}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(content, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
  // Rename a complete same-directory temp file so readers never see partial JSON.
  fs.renameSync(temporaryPath, filePath);
}
