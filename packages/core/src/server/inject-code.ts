import path, { isAbsolute, dirname } from 'path';
import fs from 'fs';
import type { CodeOptions } from '../index';
import { startServer } from './index';
import { PathName } from '../shared/constant';
import {
  isJsTypeFile,
  isNextClientFile,
  isUseEffectFile,
  getFilenameWithoutExt,
  fileURLToPath
} from '../shared/utils';

let compatibleDirname = '';

if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

// 这个路径是根据打包后来的
export const clientJsPath = path.resolve(compatibleDirname, './client.umd.js');
const jsClientCode = fs.readFileSync(clientJsPath, 'utf-8');

function getClientInjectCode(port: number, options?: CodeOptions) {
  const {
    hotKeys = ['shiftKey', 'altKey'],
    showSwitch = false,
    hideConsole = false,
    autoToggle = true,
  } = options || ({} as CodeOptions);
  return `
/* eslint-disable */
;(function (){
  if (typeof window !== 'undefined') {
    if (!document.body.querySelector('code-inspector-component')) {
      var script = document.createElement('script');
      script.setAttribute('type', 'text/javascript');
      script.textContent = ${`${jsClientCode}`};
  
      var inspector = document.createElement('code-inspector-component');
      inspector.port = ${port};
      inspector.hotkeys = '${(hotKeys ? hotKeys : [])?.join(',')}';
      inspector.showSwitch = !!${showSwitch};
      inspector.autoToggle = !!${autoToggle};
      inspector.hideConsole = !!${hideConsole};
      document.body.append(inspector);
    }
  }
})();
/* eslint-disable */
`;
}

const eliminateVueWarningCode = `
/* eslint-disable */
;(function(){
  if (globalThis.__code_inspector_warning) {
    return;
  }
  var originWarn = console.warn;
  var warning = "[Vue warn]: Extraneous non-props attributes (${PathName})";
  console.warn = function () {
    globalThis.__code_inspector_warning = true;
    var args = Array.prototype.slice.call(arguments);
    var firstParam = args && args[0];
    if (typeof firstParam === 'string' && firstParam.indexOf(warning) !== -1) {
      return;
    } else {
      originWarn.apply(null, args);
    }
  };
})();
/* eslint-disable */
`;

export type RecordInfo = {
  port: number;
  entry: string;
  nextInjectedFile: string;
  useEffectFile: string;
  injectAll: boolean;
};

export async function getServedCode(
  options: CodeOptions,
  file: string,
  code: string,
  record: RecordInfo
) {
  if (!record.port) {
    // start server
    record.port = await new Promise((resolve) => {
      startServer((port) => {
        resolve(port);
      }, options?.editor);
    });
  }

  if (options?.injectTo) {
    if (options.injectTo === 'auto') {
      //
    } else if (options.injectTo === 'all') {
      record.injectAll = true;
    } else if (isAbsolute(options.injectTo)) {
      if (isJsTypeFile(record.entry)) {
        record.entry = getFilenameWithoutExt(options.injectTo);
      } else {
        console.error(
          `The ext of "injectTo" in code-inspector-plugin must in '.js/.ts/.mjs/.mts/.jsx/.tsx'`
        );
      }
    } else {
      console.error(
        `"injectTo" in code-inspector-plugin must be 'auto' or 'all' or an absolute file path!`
      );
    }
  }
  // inject client code to entry file
  if (!record.entry && isJsTypeFile(file)) {
    record.entry = getFilenameWithoutExt(file);
  }
  // compatible to nextjs
  if (
    !record.nextInjectedFile &&
    isJsTypeFile(file) &&
    isNextClientFile(code)
  ) {
    record.nextInjectedFile = getFilenameWithoutExt(file);
  }
  // compatible to react ssr but not nextjs
  if (
    !record.nextInjectedFile &&
    !record.useEffectFile &&
    isJsTypeFile(file) &&
    isUseEffectFile(code)
  ) {
    record.useEffectFile = getFilenameWithoutExt(file);
  }
  // 注入消除 warning 代码
  if (isJsTypeFile(file) && getFilenameWithoutExt(file) === record.entry) {
    code = `${eliminateVueWarningCode}\n${code}`;
  }
  // 注入 web component 组件代码
  if (
    isJsTypeFile(file) &&
    (getFilenameWithoutExt(file) === record.entry ||
      getFilenameWithoutExt(file) === record.nextInjectedFile ||
      getFilenameWithoutExt(file) === record.useEffectFile ||
      record.injectAll)
  ) {
    code = `${code}\n${getClientInjectCode(record.port, {
      ...(options || {}),
    })}`;
  }
  return code;
}
