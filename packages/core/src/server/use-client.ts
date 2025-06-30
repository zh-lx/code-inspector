import path, { isAbsolute, dirname } from 'path';
import fs from 'fs';
import chalk from 'chalk';
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
import { getGitRemoteUrl, getCurrentBranch, getProjectRootPath } from '../shared/git-utils';

let compatibleDirname = '';

if (typeof __dirname !== 'undefined') {
  compatibleDirname = __dirname;
} else {
  compatibleDirname = dirname(fileURLToPath(import.meta.url));
}

// 这个路径是根据打包后来的
export const clientJsPath = path.resolve(compatibleDirname, './client.umd.js');
const jsClientCode = fs.readFileSync(clientJsPath, 'utf-8');

export function getInjectedCode(options: CodeOptions, port: number) {
  let code = `'use client';`;
  code += getEliminateWarningCode();
  if (options?.hideDomPathAttr) {
    code += getHidePathAttrCode();
  }
  code += getWebComponentCode(options, port);
  code += injectGitCode(options);
  return `/* eslint-disable */\n` + code.replace(/\n/g, '');
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
  const { locate = true, copy = false } = behavior;
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
      inspector.ip = '${getIP(ip)}';
      inspector.openInGit = !!${options.openInGit};
      document.documentElement.append(inspector);
    }
  }
})();
`;
}

// Add Git info to window if openInGit is enabled
export function injectGitCode(options: CodeOptions) {
  if (!options.openInGit) {
    return '';
  }

  // Pre-compute Git values at build time
  const gitRemoteUrl = getGitRemoteUrl();
  const gitBranch = getCurrentBranch();
  const projectRootPath = getProjectRootPath().replace(/\\/g, '\\\\');

  return `
  ;(function(){
    if (typeof window !== 'undefined') {
      window.CODE_INSPECTOR_GIT_URL = "${gitRemoteUrl}";
      window.CODE_INSPECTOR_GIT_BRANCH = "${gitBranch}";
      window.CODE_INSPECTOR_PROJECT_ROOT_PATH = "${projectRootPath}";
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
function recordEntry(record: RecordInfo, file: string) {
  if (!record.entry && isJsTypeFile(file) && !isNextjsInstrumentationFile(file)) {
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
    record.injectTo = (injectTo || []).map(file => normalizePath(file));
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
  if (!options.openInGit) {
    await startServer(options, record);
  }

  recordInjectTo(record, options);
  recordEntry(record, file);

  // 注入消除 warning 代码
  const isTargetFile = await isTargetFileToInject(file, record);
  if (isTargetFile || inject) {
    const injectCode = getInjectedCode(options, record.port);
    if (isNextjsProject() || options.importClient === 'file') {
      writeEslintRcFile(record.output);
      const webComponentNpmPath = writeWebComponentFile(
        record.output,
        injectCode,
        record.port
      );
      if (!file.match(webComponentNpmPath)) {
        code = `import '${webComponentNpmPath}';${code}`;
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
  return isNextjsProject() && getFilePathWithoutExt(file).endsWith('/instrumentation');
}
