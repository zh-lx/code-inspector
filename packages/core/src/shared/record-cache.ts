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
  return (
    readRuntimeJsonFile<Partial<RecordInfo>>(getBuildStateFilePath(output)) ||
    BuildStateCache.get(getBuildStateFilePath(output))
  );
}

function writeBuildState(output: string, state: Partial<RecordInfo>) {
  const filePath = getBuildStateFilePath(output);
  try {
    writeRuntimeJsonFile(output, filePath, state);
    BuildStateCache.delete(filePath);
  } catch {
    BuildStateCache.set(filePath, state);
  }
}

export const resetFileRecord = (output: string) => {
  const serverState = getServerRuntimeState({ output });
  const currentBuildState = getBuildState(output);
  writeBuildState(output, {
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
  const port = patch.port;
  const buildPatch: Partial<RecordInfo> = { ...patch };
  delete buildPatch.port;
  delete buildPatch.findPort;

  if (Object.prototype.hasOwnProperty.call(patch, 'port')) {
    if (port) {
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
        // @ts-ignore RecordInfo contains fields with different value types.
        buildState[key] = value;
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

export const findPort = async (
  record: RecordInfo,
  timeoutMs = 10_000,
): Promise<number> => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const port = getProjectRecord(record)?.port;
    if (port) {
      return port;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error('Timed out waiting for the code-inspector server port.');
};
