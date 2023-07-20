import path from 'path';
import fs from 'fs';
import { dirname } from 'path';

let compatibleDirname = '';

function fileURLToPath(fileURL: string) {
  let filePath = fileURL;
  if (process.platform === 'win32') {
    filePath = filePath.replace(/^file:\/\/\//, '');
    filePath = decodeURIComponent(filePath);
    filePath = filePath.replace(/\//g, '\\');
  } else {
    filePath = filePath.replace(/^file:\/\//, '');
    filePath = decodeURIComponent(filePath);
  }
  return filePath;
}

if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

const jsCodePath = path.resolve(compatibleDirname, './client.umd.js');

const jsCode = fs.readFileSync(jsCodePath, 'utf-8');

export type HotKey = 'ctrlKey' | 'altKey' | 'metaKey' | 'shiftKey';
export type CodeOptions = {
  /**
   * @cn 触发 DOM 定位功能的组合键，ctrlKey/altKey/metaKey/shiftKey 中一个或多个组成的数组，默认值为 ['altKey', 'shiftKey]。即 Mac 系统默认是 Option + Shift；Window 默认是 Alt + Shift。
   * @en The combination keys that triggers the DOM positioning function, it is an array of one or more from ctrlKey/altKey/metaKey/shiftKey, with default values of ['altKey', 'shiftKey']. The default for Mac systems is Option+Shift; and for Window is Alt+Shift.
   */
  hotKeys?: HotKey[] | false;
  /**
   * @cn 是否在页面展示功能开关按钮
   * @en Whether show the switch button of this function on the page
   */
  showSwitch?: boolean;
  /**
   * @cn 打开功能开关的情况下，点击触发跳转编辑器时是否自动关闭开关
   * @en When opening the function switch, whether automatically close the switch when triggering the jump editor function.
   */
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

export { startServer, enhanceCode, normalizePath, parseSFC } from './server';
