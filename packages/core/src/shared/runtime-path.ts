import fs from 'fs';
import os from 'os';
import path from 'path';

export const SERVER_PROTOCOL_VERSION = 1;

let temporaryFileSequence = 0;

function getStringHash(value: string) {
  let first = 5381;
  let second = 52711;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first, 33) ^ code;
    second = Math.imul(second, 65599) + code;
  }
  return [first, second]
    .map((part) => (part >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

function getUserId() {
  const value =
    typeof process.getuid === 'function'
      ? String(process.getuid())
      : process.env.USERNAME || process.env.USER || 'default';
  return value.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

export function getProjectId() {
  return getStringHash(process.cwd());
}

export function getRuntimeDirectory(output: string) {
  const identity = `${process.cwd()}\0${path.resolve(output)}\0${SERVER_PROTOCOL_VERSION}`;
  return path.join(
    os.tmpdir(),
    'code-inspector-plugin',
    getUserId(),
    getStringHash(identity),
  );
}

export function ensureRuntimeDirectory(output: string) {
  const directory = getRuntimeDirectory(output);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
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
  fs.renameSync(temporaryPath, filePath);
}
