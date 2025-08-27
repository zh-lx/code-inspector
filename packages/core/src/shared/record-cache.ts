import path from 'path';
import fs from 'fs';
import { RecordInfo } from './type';

export const resetFileRecord = (output: string) => {
  const recordFilePath = path.resolve(output, './record.json');
  const projectDir = process.cwd();
  let content: {
    [key: string]: any;
  } = {};
  if (fs.existsSync(recordFilePath)) {
    try {
      content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
    } catch (error) {
      content = {};
    }
  }
  content[projectDir] = {
    port: 0,
    entry: '',
  };
  fs.writeFileSync(recordFilePath, JSON.stringify(content, null, 2), 'utf-8');
};

export const getProjectRecord = (record: RecordInfo) => {
  const recordFilePath = path.resolve(record.output, './record.json');
  const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
  return content[process.cwd()];
};

export const setProjectRecord = (
  record: RecordInfo,
  key: keyof RecordInfo,
  value: RecordInfo[keyof RecordInfo]
) => {
  const recordFilePath = path.resolve(record.output, './record.json');
  const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
  content[process.cwd()][key] = value;
  fs.writeFileSync(recordFilePath, JSON.stringify(content, null, 2), 'utf-8');
};

export const findPort = async (record: RecordInfo): Promise<number> => {
  const recordFilePath = path.resolve(record.output, './record.json');
  const content = JSON.parse(fs.readFileSync(recordFilePath, 'utf-8'));
  if (content[process.cwd()].port) {
    return content[process.cwd()].port;
  }
  return new Promise(async (resolve) => {
    const port = await findPort(record);
    resolve(port);
  });
};
