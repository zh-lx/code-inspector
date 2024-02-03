import path, { isAbsolute, dirname } from 'path';
import fs from 'fs';
import { startServer } from './server';
import type { CodeOptions, RecordInfo } from '../shared';
import {
  PathName,
  isJsTypeFile,
  isNextJsEntry,
  isSsrEntry,
  getFilenameWithoutExt,
  fileURLToPath,
  ViteVirtualModule_Client,
  ViteVirtualModule_EliminateVueWarning,
} from '../shared';

let compatibleDirname = '';

if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

// 这个路径是根据打包后来的
export const clientJsPath = path.resolve(compatibleDirname, './client.umd.js');
const jsClientCode = fs.readFileSync(clientJsPath, 'utf-8');

export function getClientInjectCode(port: number, options?: CodeOptions) {
  const {
    hotKeys = ['shiftKey', 'altKey'],
    showSwitch = false,
    hideConsole = false,
    autoToggle = true,
    behavior = {},
  } = options || ({} as CodeOptions);
  const { locate = true, copy = false } = behavior;
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
      inspector.locate = !!${locate};
      inspector.copy = ${typeof copy === 'string' ? `'${copy}'` : !!copy};
      document.body.append(inspector);
    }
  }
})();
/* eslint-disable */
`;
}

export function getEliminateVueWarningCode() {
  return `
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
}

// normal entry file
function recordNormalEntry(record: RecordInfo, file: string) {
  if (!record.entry && isJsTypeFile(file) && !file.includes('/.svelte-kit/')) {
    record.entry = getFilenameWithoutExt(file);
  }
}
// nextjs entry file
function recordNextjsEntry(record: RecordInfo, file: string, code: string) {
  if (!record.nextJsEntry && isJsTypeFile(file) && isNextJsEntry(code)) {
    record.nextJsEntry = getFilenameWithoutExt(file);
  }
}
// ssr(not nextjs) entry file
function recordSSREntry(record: RecordInfo, file: string, code: string) {
  if (
    !record.nextJsEntry &&
    !record.ssrEntry &&
    isJsTypeFile(file) &&
    isSsrEntry(code)
  ) {
    record.ssrEntry = getFilenameWithoutExt(file);
  }
}

export async function getCodeWithWebComponent(
  options: CodeOptions,
  file: string,
  code: string,
  record: RecordInfo
) {
  // start server
  await startServer(options, record);

  // injectTo
  if (options?.injectTo) {
    if (!isAbsolute(options.injectTo)) {
      console.error(
        `"injectTo" in code-inspector-plugin must be an absolute file path!`
      );
    } else if (!isJsTypeFile(options.injectTo)) {
      console.error(
        `The ext of "injectTo" in code-inspector-plugin must in '.js/.ts/.mjs/.mts/.jsx/.tsx'`
      );
    } else {
      record.entry = getFilenameWithoutExt(options.injectTo);
    }
  }

  recordNormalEntry(record, file);
  recordNextjsEntry(record, file, code);
  recordSSREntry(record, file, code);

  // 注入消除 warning 代码
  if (isJsTypeFile(file) && getFilenameWithoutExt(file) === record.entry) {
    if (options.bundler === 'vite') {
      code = `import '${ViteVirtualModule_EliminateVueWarning}';\n${code}`;
    } else {
      code = `${getEliminateVueWarningCode()}\n${code}`;
    }
  }
  // 注入 web component 组件代码
  if (
    isJsTypeFile(file) &&
    [record.entry, record.nextJsEntry, record.ssrEntry].includes(
      getFilenameWithoutExt(file)
    )
  ) {
    if (options.bundler === 'vite') {
      code = `import '${ViteVirtualModule_Client}';\n${code}`;
    } else {
      const clientCode = getClientInjectCode(record.port, {
        ...(options || {}),
      });
      code = `${code}\n${clientCode}`;
    }
  }
  return code;
}
