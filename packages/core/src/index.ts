import path from 'path';
import fs from 'fs';
import {
  StartServer,
  getEnhanceContent,
  _normalizePath,
  parseSFC as _parseSFC,
} from './server';
import { dirname } from 'path';

function fileURLToPath(fileURL: string) {
  let filePath = fileURL;
  if (process.platform === 'win32') {
    filePath = filePath.replace(/^file:\/\/\//, '');
    filePath = decodeURIComponent(filePath);
    filePath = filePath.replace(/\//g, '\\');
  }
  return filePath;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const jsCodePath = path.resolve(__dirname, './client.umd.js');

const jsCode = fs.readFileSync(jsCodePath, 'utf-8');

export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type CodeOptions = {
  hotKeys?: HotKey[] | false;
  showSwitch?: boolean;
  autoToggle?: boolean;
};

export function getInjectCode(port: number, options?: CodeOptions) {
  const {
    hotKeys = ['shiftKey', 'altKey'],
    showSwitch = false,
    autoToggle = true,
  } = options || ({} as CodeOptions);
  return `<code-inspector-component port=${port} hotKeys="${(hotKeys
    ? hotKeys
    : []
  )?.join(',')}"
  ${showSwitch ? 'showSwitch=true' : ''} ${
    autoToggle ? 'autoToggle=true' : ''
  }></code-inspector-component>
  <script type="text/javascript">
  ${jsCode}
  </script>`;
}

export const startServer = StartServer;
export const enhanceVueCode = getEnhanceContent;
export const normalizePath = _normalizePath;
export const parseSFC = _parseSFC;
