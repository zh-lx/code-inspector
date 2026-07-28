import type { RecordInfo } from './type';
import {
  getBuildStateFilePath,
  readRuntimeJsonFile,
  writeRuntimeJsonFile,
} from './runtime-path';
import {
  clearServerRuntimeState,
  getServerRuntimeState,
  publishServerRuntimeState,
} from './server-state';

const BuildStateCache = new Map<string, Partial<RecordInfo>>();

function getBuildState(output: string) {
  const filePath = getBuildStateFilePath(output);
  return (
    BuildStateCache.get(filePath) ||
    readRuntimeJsonFile<Partial<RecordInfo>>(filePath)
  );
}

function writeBuildState(output: string, state: Partial<RecordInfo>) {
  const filePath = getBuildStateFilePath(output);
  try {
    writeRuntimeJsonFile(output, filePath, state);
    BuildStateCache.delete(filePath);
  } catch {
    // Keep an in-memory fallback when runtime storage is unavailable, as before.
    BuildStateCache.set(filePath, state);
  }
}

export const resetFileRecord = (output: string) => {
  const serverState = getServerRuntimeState({ output });
  const currentBuildState = getBuildState(output);
  writeBuildState(output, {
    // Preserve the latest port for callers that still consume previousPort on rebuild.
    previousPort:
      serverState?.port ||
      currentBuildState?.port ||
      currentBuildState?.previousPort,
    entry: '',
  });
};

export const updateProjectRecord = (
  record: RecordInfo,
  patch: Partial<RecordInfo>,
) => {
  // Keep server runtime state separate from build state to avoid concurrent overwrites.
  const port = patch.port;
  const buildPatch: Partial<RecordInfo> = { ...patch };
  delete buildPatch.port;

  if (Object.prototype.hasOwnProperty.call(patch, 'port')) {
    if (port) {
      // Support legacy port writes; coordinated startup uses the lock token instead.
      publishServerRuntimeState(
        record,
        port,
        `compat-${process.pid}-${Date.now()}`,
      );
    } else {
      clearServerRuntimeState(record);
    }
  }

  const buildKeys = Object.keys(buildPatch);
  if (buildKeys.length > 0) {
    const buildState = getBuildState(record.output) || {};
    buildKeys.forEach((key) => {
      const value = buildPatch[key as keyof RecordInfo];
      if (value === undefined) {
        delete buildState[key as keyof RecordInfo];
      } else {
        (buildState as Record<string, unknown>)[key] = value;
      }
    });
    writeBuildState(record.output, buildState);
  }
};

export const getProjectRecord = (
  record: Pick<RecordInfo, 'output'>,
): Partial<RecordInfo> | undefined => {
  const buildState = getBuildState(record.output);
  const serverState = getServerRuntimeState(record);
  if (!buildState && !serverState) {
    return undefined;
  }
  return {
    // Merge both stores into the legacy RecordInfo shape expected by existing callers.
    ...buildState,
    ...(serverState ? { port: serverState.port } : {}),
  };
};

export const setProjectRecord = (
  record: RecordInfo,
  key: keyof RecordInfo,
  value: RecordInfo[keyof RecordInfo],
) => {
  updateProjectRecord(record, { [key]: value });
};
