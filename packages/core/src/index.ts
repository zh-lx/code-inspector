import path, { isAbsolute } from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { Editor } from './shared/constant';
import { startServer, enhanceCode, normalizePath, parseSFC } from './server';

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
   * @cn 是否隐藏在控制台的按键提示
   * @en Whether hide the tips of combination keys on console.
   */
  hideConsole?: boolean;
  /**
   * @cn 打开功能开关的情况下，点击触发跳转编辑器时是否自动关闭开关
   * @en When opening the function switch, whether automatically close the switch when triggering the jump editor function.
   */
  autoToggle?: boolean;
  editor?: Editor;
  /**
   * @cn 用于注入DOM 筛选和点击跳转vscode的相关代码的文件。必须为绝对路径且以 `.js/.ts/.mjs/.mts/.jsx/.tsx` 为结尾的文件
   * @en The file to inject the relevant code for DOM filtering and click navigation in VSCode. Must be an absolute path and end with `.js/.ts/.mjs/.mts/.jsx/.tsx`.
   */
  injectTo?: 'auto' | 'all' | string;
  /**
   * @cn 是否在转换时添加 `enforce: 'pre'`，默认值为 `true`。（若因该插件引起了 `eslint-plugin` 校验错误，需要此项设置为 `false`）
   * @en Whether to add `enforce: 'pre'` during the transformation, default value is `true`. (If this plugin causes `eslint-plugin` validation errors, set this option to `false`)
   */
  enforcePre?: boolean;
};

export function getInjectCode(port: number, options?: CodeOptions) {
  const {
    hotKeys = ['shiftKey', 'altKey'],
    showSwitch = false,
    hideConsole = false,
    autoToggle = true,
  } = options || ({} as CodeOptions);
  return `
/* eslint-disable */
if (typeof window !== 'undefined') {
  if (!document.body.querySelector('code-inspector-component')) {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.textContent = ${`${jsCode}`};

    const inspector = document.createElement('code-inspector-component');
    inspector.port = ${port};
    inspector.hotkeys = '${(hotKeys ? hotKeys : [])?.join(',')}';
    inspector.showSwitch = !!${showSwitch};
    inspector.autoToggle = !!${autoToggle};
    inspector.hideConsole = !!${hideConsole};
    document.body.append(inspector);
  }
}
/* eslint-disable */
`;
}

// 获取不带文件后缀名的文件路径
export function getFilenameWithoutExt(filePath: string) {
  while (path.parse(filePath).ext) {
    filePath = path.parse(filePath).name;
  }
  return filePath;
}

// 检测是否为符合可注入代码的目标文件
export function isTargetFile(file: string) {
  return ['.js', '.ts', '.mjs', '.mts', '.jsx', '.tsx'].some((ext) =>
    file.endsWith(ext)
  );
}

// 检测是否为 nextjs 中的 client 文件
export function isNextClientFile(code: string) {
  return (
    code.trim().startsWith(`"use client"`) ||
    code.trim().startsWith(`'use client'`) ||
    code.trim().startsWith(`"use client;"`) ||
    code.trim().startsWith(`'use client;'`)
  );
}

// 检测是否为 useEffect 文件
export function isUseEffectFile(code: string) {
  return code.includes(`useEffect(`);
}

let port = 0;
let entry = '';
let nextInjectedFile = '';
let useEffectFile = '';
let injectAll = false;

export async function getServedCode(
  options: CodeOptions,
  rootPath: string,
  file: string,
  code: string
) {
  // start server
  port = await new Promise((resolve) => {
    startServer(
      (port) => {
        resolve(port);
      },
      rootPath,
      options?.editor
    );
  });

  if (options?.injectTo) {
    if (options.injectTo === 'auto') {
      //
    } else if (options.injectTo === 'all') {
      injectAll = true;
    } else if (isAbsolute(options.injectTo)) {
      if (isTargetFile(entry)) {
        entry = getFilenameWithoutExt(options.injectTo);
      } else {
        console.error(`The ext of "injectTo" in code-inspector-plugin must in '.js/.ts/.mjs/.mts/.jsx/.tsx'`)
      }
    } else {
      console.error(`"injectTo" in code-inspector-plugin must be 'auto' or 'all' or an absolute file path!`)
    }
  }
  // inject client code to entry file
  if (!entry && isTargetFile(file)) {
    entry = getFilenameWithoutExt(file);
  }
  // compatible to nextjs
  if (!nextInjectedFile && isTargetFile(file) && isNextClientFile(code)) {
    nextInjectedFile = getFilenameWithoutExt(file);
  }
  // compatible to react ssr but not nextjs
  if (!nextInjectedFile && !useEffectFile && isTargetFile(file) && isUseEffectFile(code)) {
    useEffectFile = getFilenameWithoutExt(file);
  }
  if (
    isTargetFile(file) &&
    (getFilenameWithoutExt(file) === entry ||
      getFilenameWithoutExt(file) === nextInjectedFile ||
      getFilenameWithoutExt(file) === useEffectFile || injectAll)
  ) {
    code = `${code}\n${getInjectCode(port, {
      ...(options || {}),
    })}`;
  }
  return code;
}

export { startServer, enhanceCode, normalizePath, parseSFC };
