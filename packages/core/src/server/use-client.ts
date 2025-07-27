import path, { isAbsolute, dirname } from 'path';
import fs from 'fs';
import chalk from 'chalk';
import MagicString from 'magic-string';
// @ts-ignore
import { parse, traverse } from '@babel/core';
// @ts-ignore
import tsPlugin from '@babel/plugin-transform-typescript';
// @ts-ignore
import importMetaPlugin from '@babel/plugin-syntax-import-meta';
// @ts-ignore
import proposalDecorators from '@babel/plugin-proposal-decorators';
import { startServer } from './server';
import type { CodeOptions, RecordInfo } from '../shared';
import {
  PathName,
  isJsTypeFile,
  getFilePathWithoutExt,
  fileURLToPath,
  AstroToolbarFile,
  getIP,
  getDenpendencies,
  normalizePath,
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

const NextEmptyElementName = 'CodeInspectorEmptyElement';
export function getInjectedCode(
  options: CodeOptions,
  port: number,
  isNextjs: boolean
) {
  let code = `'use client';`;
  code += getEliminateWarningCode();
  if (options?.hideDomPathAttr) {
    code += getHidePathAttrCode();
  }
  code += getWebComponentCode(options, port);
  code = `/* eslint-disable */\n` + code.replace(/\n/g, '');
  if (isNextjs) {
    code += `
    export default function ${NextEmptyElementName}() {
      return null;
    }
    `;
  }
  return code;
}

// For Next.js, add a CodeInspectorEmptyComp component to inject file
function addNextEmptyElementToEntry(content: string) {
  let hasAddedEmptyElement = false;
  const s = new MagicString(content);

  const ast = parse(content, {
    babelrc: false,
    comments: true,
    configFile: false,
    plugins: [
      importMetaPlugin,
      [tsPlugin, { isTSX: true, allowExtensions: true }],
      [proposalDecorators, { legacy: true }],
    ],
  });

  traverse(ast!, {
    enter({ node }: any) {
      if (hasAddedEmptyElement) {
        return;
      }
      if (node.type === 'JSXElement' && node.closingElement?.start) {
        s.prependLeft(node.closingElement.start, `<${NextEmptyElementName} />`);
        hasAddedEmptyElement = true;
      }
    },
  });

  return s.toString();
}

export function getWebComponentCode(options: CodeOptions, port: number) {
  const {
    hotKeys = ['shiftKey', 'altKey'],
    showSwitch = false,
    hideConsole = false,
    autoToggle = true,
    behavior = {},
    ip = false,
  } = options || ({} as CodeOptions);
  const { locate = true, copy = false, target = '' } = behavior;
  return `
;(function (){
  if (typeof window !== 'undefined') {
    if (!document.documentElement.querySelector('code-inspector-component')) {
      ${jsClientCode};
      
      var inspector = document.createElement('code-inspector-component');
      inspector.port = ${port};
      inspector.hotKeys = '${(hotKeys ? hotKeys : [])?.join(',')}';
      inspector.showSwitch = !!${showSwitch};
      inspector.autoToggle = !!${autoToggle};
      inspector.hideConsole = !!${hideConsole};
      inspector.locate = !!${locate};
      inspector.copy = ${typeof copy === 'string' ? `'${copy}'` : !!copy};
      inspector.target = '${target}';
      inspector.ip = '${getIP(ip)}';
      document.documentElement.append(inspector);
    }
  }
})();
`;
}

export function getEliminateWarningCode() {
  return `
  ;(function(){
    if (typeof globalThis === 'undefined' || globalThis.__code_inspector_console) {
      return;
    };
    var path = "${PathName}";
    globalThis.__code_inspector_console = true;
    var wrappers = [
      {
        type: 'error',
        origin: console.error,
      },
      {
        type: 'warn',
        origin: console.warn,
      },
    ];
    wrappers.forEach(wrapper => {
      console[wrapper.type] = function () {
        var args = Array.prototype.slice.call(arguments) || [];
        var hasVueWarning = typeof args[0] === 'string' && args[0].indexOf(path) !== -1; /* compatible for vue warning */
        if (hasVueWarning) {
          return;
        }
        var hasNextWarning = typeof args[1] === 'string' && args[1].indexOf(path) !== -1; /* compatible for nextjs hydrate */
        if (hasNextWarning) {
          return;
        }
        var hasNextWarningV15 = typeof args[2] === 'string' && args[2].indexOf(path) !== -1; /* compatible for nextjs(v15.0.0+) hydrate */
        if (hasNextWarningV15) {
          return;
        }
        wrapper.origin.apply(null, args);
      };
    });
  })();
  `;
}

export function getHidePathAttrCode() {
  return `
  ;(function(){
    if (typeof window === 'undefined' || window.__code_inspector_observed) {
      return;
    };
    function observe() {
      document.querySelectorAll("[${PathName}]").forEach((node) => {
        node["${PathName}"] = node.getAttribute("${PathName}");
        node.removeAttribute("${PathName}");
      });
      setTimeout(observe, 1000);
    }
    observe();
    window.__code_inspector_observed = true;
  })();
  `;
}

// normal entry file
function recordEntry(record: RecordInfo, file: string, isNextjs: boolean) {
  if (isNextjs) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content === addNextEmptyElementToEntry(content)) {
      return;
    }
  }
  if (
    !record.entry &&
    isJsTypeFile(file) &&
    !isNextjsInstrumentationFile(file)
  ) {
    // exclude svelte kit server entry file
    if (file.includes('/.svelte-kit/')) {
      return;
    }
    // exclude nextjs layout entry
    if (file.replace(path.extname(file), '').endsWith('/app/layout')) {
      return;
    }
    record.entry = getFilePathWithoutExt(file);
  }
}

// target file to inject code
async function isTargetFileToInject(file: string, record: RecordInfo) {
  const inputs: string[] = await (record.inputs || []);
  return (
    (isJsTypeFile(file) && getFilePathWithoutExt(file) === record.entry) ||
    file === AstroToolbarFile ||
    record.injectTo?.includes(normalizePath(file)) ||
    inputs?.includes(normalizePath(file))
  );
}

function recordInjectTo(record: RecordInfo, options: CodeOptions) {
  if (options?.injectTo) {
    const injectTo = Array.isArray(options.injectTo)
      ? options.injectTo
      : [options.injectTo];
    injectTo.forEach((injectToPath) => {
      if (!isAbsolute(injectToPath)) {
        console.log(
          chalk.cyan('injectTo') +
            chalk.red(' in ') +
            chalk.cyan('code-inspector-plugin') +
            chalk.red('must be an absolute file path!')
        );
      } else if (!isJsTypeFile(injectToPath)) {
        console.log(
          chalk.red('The ext of ') +
            chalk.cyan('injectTo') +
            chalk.red(' in ') +
            chalk.cyan('code-inspector-plugin') +
            chalk.red('must in .js/.ts/.mjs/.mts/.jsx/.tsx')
        );
      }
    });
    record.injectTo = (injectTo || []).map((file) => normalizePath(file));
  }
}

export async function getCodeWithWebComponent({
  options,
  record,
  file,
  code,
  inject = false,
}: {
  options: CodeOptions;
  record: RecordInfo;
  file: string;
  code: string;
  inject?: boolean;
}) {
  // start server
  if (options.behavior?.locate !== false) {
    await startServer(options, record);
  }

  const isNextjs = isNextjsProject();

  recordInjectTo(record, options);
  recordEntry(record, file, isNextjs);

  // 注入消除 warning 代码
  const isTargetFile = await isTargetFileToInject(file, record);
  if (isTargetFile || inject) {
    const injectCode = getInjectedCode(options, record.port, isNextjs);
    if (isNextjs || options.importClient === 'file') {
      writeEslintRcFile(record.output);
      const webComponentNpmPath = writeWebComponentFile(
        record.output,
        injectCode,
        record.port
      );
      if (!file.match(webComponentNpmPath)) {
        if (isNextjs) {
          code = `import ${NextEmptyElementName} from '${webComponentNpmPath}';\n${code}`;
          code = addNextEmptyElementToEntry(code);
        } else {
          code = `import '${webComponentNpmPath}';${code}`;
        }
      }
    } else {
      code = `${injectCode};${code}`;
    }
  }
  return code;
}

function writeEslintRcFile(targetPath: string) {
  const eslintFilePath = path.resolve(targetPath, './.eslintrc.js');
  if (!fs.existsSync(eslintFilePath)) {
    const content = `
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 6
  },
}
`;
    fs.writeFileSync(eslintFilePath, content, 'utf-8');
  }
}

function writeWebComponentFile(
  targetPath: string,
  content: string,
  port: number
) {
  const webComponentFileName = `append-code-${port}.js`;
  const webComponentNpmPath = `code-inspector-plugin/dist/${webComponentFileName}`;
  const webComponentFilePath = path.resolve(targetPath, webComponentFileName);
  fs.writeFileSync(webComponentFilePath, content, 'utf-8');
  return webComponentNpmPath;
}

function isNextjsProject() {
  const dependencies = getDenpendencies();
  return dependencies.includes('next');
}

function isNextjsInstrumentationFile(file: string) {
  return (
    isNextjsProject() &&
    getFilePathWithoutExt(file).endsWith('/instrumentation')
  );
}
