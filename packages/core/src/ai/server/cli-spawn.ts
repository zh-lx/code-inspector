import { spawn, type ChildProcess, type SpawnOptions } from 'child_process';
import path from 'path';

const WINDOWS_SCRIPT_EXTENSIONS = new Set(['.bat', '.cmd']);

export interface CliSpawnCommand {
  command: string;
  args: string[];
}

/**
 * Windows cannot execute npm's .cmd/.bat shims as native processes. Route
 * those scripts through the command interpreter while preserving the argv
 * boundary for the CLI itself.
 */
export function normalizeCliSpawnCommand(
  command: string,
  args: string[],
): CliSpawnCommand {
  if (
    process.platform !== 'win32' ||
    !WINDOWS_SCRIPT_EXTENSIONS.has(path.extname(command).toLowerCase())
  ) {
    return { command, args };
  }

  return {
    command: process.env.ComSpec || process.env.COMSPEC || 'cmd.exe',
    args: ['/d', '/s', '/c', command, ...args],
  };
}

export function spawnCli(
  command: string,
  args: string[],
  options: SpawnOptions,
): ChildProcess {
  const normalized = normalizeCliSpawnCommand(command, args);
  return spawn(normalized.command, normalized.args, options);
}
