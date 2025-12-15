import path from 'path';
import fs from 'fs';
import type { RecordInfo } from './type';
import { hasWritePermission } from './utils';

const RecordCache: { [key: string]: Partial<RecordInfo> } = {};

function getRecordFileContent(recordFilePath: string): {
  [key: string]: Partial<RecordInfo>;
} {
  if (!hasWritePermission(recordFilePath)) {
    return RecordCache;
  }
  if (fs.existsSync(recordFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
    } catch (error) {
      return {};
    }
  }
  return {};
}

export const resetFileRecord = (output: string) => {
  const recordFilePath = path.resolve(output, './record.json');
  const projectDir = process.cwd();
  const content = getRecordFileContent(recordFilePath);
  const EmptyRecord: Partial<RecordInfo> = {
    previousPort: content[projectDir]?.port,
    port: 0,
    entry: '',
  };
  content[projectDir] = EmptyRecord;
  if (hasWritePermission(recordFilePath)) {
    fs.writeFileSync(recordFilePath, JSON.stringify(content, null, 2), 'utf-8');
  } else {
    RecordCache[projectDir] = EmptyRecord;
  }
};

export const getProjectRecord = (record: RecordInfo) => {
  const recordFilePath = path.resolve(record.output, './record.json');
  const content = getRecordFileContent(recordFilePath);
  const projectDir = process.cwd();
  if (hasWritePermission(recordFilePath)) {
    return content[projectDir];
  } else {
    return RecordCache[projectDir];
  }
};

export const setProjectRecord = (
  record: RecordInfo,
  key: keyof RecordInfo,
  value: RecordInfo[keyof RecordInfo]
) => {
  const recordFilePath = path.resolve(record.output, './record.json');
  const content = getRecordFileContent(recordFilePath);
  const projectDir = process.cwd();
  if (!content[projectDir]) {
    content[projectDir] = {};
  }
  // @ts-ignore
  content[projectDir][key] = value;
  if (hasWritePermission(recordFilePath)) {
    fs.writeFileSync(recordFilePath, JSON.stringify(content, null, 2), 'utf-8');
  } else {
    RecordCache[projectDir] = content[projectDir];
  }
};

export const findPort = async (record: RecordInfo): Promise<number> => {
  const recordFilePath = path.resolve(record.output, './record.json');
  const content = getRecordFileContent(recordFilePath);
  const projectDir = process.cwd();
  if (content[projectDir]?.port) {
    return content[projectDir].port as number;
  } else if (RecordCache[projectDir]?.port) {
    return RecordCache[projectDir]?.port as number;
  }
  return new Promise((resolve) => {
    setTimeout(async () => {
      const port = await findPort(record);
      resolve(port);
    });
  });
};
