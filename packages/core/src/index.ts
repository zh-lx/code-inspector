import path from 'path';
import fs from 'fs';
import {
  StartServer,
  getEnhanceContent,
  _normalizePath,
  parseSFC as _parseSFC,
} from './server';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const jsCodePath = path.resolve(__dirname, './client.umd.cjs');
// todo
console.log(11111, jsCodePath);
const jsCode = fs.readFileSync(jsCodePath, 'utf-8');

export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type CodeOptions = {
  hotKeys?: HotKey[] | false;
  showSwitch?: boolean;
  autoToggle?: boolean;
};

export const getInjectCode = (port: number, options?: CodeOptions) => {
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
};

export const startServer = StartServer;
export const enhanceVueCode = getEnhanceContent;
export const normalizePath = _normalizePath;
export const parseSFC = _parseSFC;
