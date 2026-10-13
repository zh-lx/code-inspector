/// <reference types="node" />
import { type ChildProcess, type SpawnOptions } from 'child_process';
export interface CliSpawnCommand {
    command: string;
    args: string[];
}
/**
 * Windows cannot execute npm's .cmd/.bat shims as native processes. Route
 * those scripts through the command interpreter while preserving the argv
 * boundary for the CLI itself.
 */
export declare function normalizeCliSpawnCommand(command: string, args: string[]): CliSpawnCommand;
export declare function spawnCli(command: string, args: string[], options: SpawnOptions): ChildProcess;
