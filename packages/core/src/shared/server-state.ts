import fs from 'fs';
import type { RecordInfo } from './type';
import {
  getProjectId,
  getServerStateFilePath,
  readRuntimeJsonFile,
  SERVER_PROTOCOL_VERSION,
  writeRuntimeJsonFile,
} from './runtime-path';

export interface ServerRuntimeState {
  protocolVersion: number;
  projectId: string;
  instanceId: string;
  pid: number;
  port: number;
  startedAt: number;
  updatedAt: number;
}

export function getServerRuntimeState(
  record: Pick<RecordInfo, 'output'>,
): ServerRuntimeState | undefined {
  const state = readRuntimeJsonFile<ServerRuntimeState>(
    getServerStateFilePath(record.output),
  );
  // Ignore foreign or obsolete metadata; the health check separately verifies liveness.
  if (
    state?.protocolVersion !== SERVER_PROTOCOL_VERSION ||
    state.projectId !== getProjectId() ||
    !state.port
  ) {
    return undefined;
  }
  return state;
}

export function publishServerRuntimeState(
  record: Pick<RecordInfo, 'output'>,
  port: number,
  instanceId: string,
) {
  const now = Date.now();
  const state: ServerRuntimeState = {
    protocolVersion: SERVER_PROTOCOL_VERSION,
    projectId: getProjectId(),
    instanceId,
    pid: process.pid,
    port,
    startedAt: now,
    updatedAt: now,
  };
  writeRuntimeJsonFile(
    record.output,
    getServerStateFilePath(record.output),
    state,
  );
  return state;
}

export function clearServerRuntimeState(
  record: Pick<RecordInfo, 'output'>,
  expectedInstanceId?: string,
) {
  const filePath = getServerStateFilePath(record.output);
  try {
    const current = readRuntimeJsonFile<ServerRuntimeState>(filePath);
    // Conditional deletion keeps a failed old instance from clearing newer state.
    if (expectedInstanceId && current?.instanceId !== expectedInstanceId) {
      return false;
    }
    fs.unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}
