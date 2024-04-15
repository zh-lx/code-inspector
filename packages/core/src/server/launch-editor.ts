// @ts-ignore
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import os from 'os';
import chalk from 'chalk';
import dotenv from 'dotenv';
import {
  Editor,
  FormatColumn,
  FormatFile,
  FormatLine,
  IDEOpenMethod,
  formatOpenPath,
} from '../shared';

function isTerminalEditor(editor: string) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
  }
  return false;
}

type CodeMapType = {
  mac: {
    [key in Editor]: string;
  };
  linux: {
    [key in Editor]: string;
  };
  win: {
    [key in Editor]: string[];
  };
};

const CodeMap: CodeMapType = {
  mac: {
    code: '/Visual Studio Code.app/', // confirmed
    code_insiders: '/Visual Studio Code - Insiders.app/', // confirmed
    webstorm: '/WebStorm.app/', // confirmed
    atom: '/Atom.app/', // confirmed
    hbuilder: '/HBuilderX.app/', // confirmed
    phpstorm: '/PhpStorm.app/', // confirmed
    pycharm: '/PyCharm.app/', // confirmed
    idea: '/IntelliJ IDEA.app/', // confirmed
    // sublime_text: '/Applications/Sublime Text.app/Contents/MacOS/sublime_text', // can't open the opened project
    // brackets: '/Applications/Brackets.app/Contents/MacOS/Brackets', // can't open file
    // vscodium: 'codium', // cant't open the specific line and column
  },
  linux: {
    code: 'code',
    code_insiders: 'code-insiders',
    webstorm: 'webstorm.sh',
    atom: 'atom',
    hbuilder: 'hbuilderx.sh',
    phpstorm: 'phpstorm.sh',
    pycharm: 'pycharm.sh',
    idea: 'idea.sh',
    // brackets: 'brackets',
    // vscodium: 'vscodium',
    // sublime_text: 'sublime_text',
  },
  win: {
    code: ['Code.exe'], // confirmed
    code_insiders: ['Code - Insiders.exe'],
    webstorm: ['webstorm.exe', 'webstorm64.exe'],
    atom: ['atom.exe'],
    hbuilder: ['HBuilderX.exe', 'HBuilder.exe'],
    phpstorm: ['phpstorm.exe', 'phpstorm64.exe'],
    pycharm: ['pycharm.exe', 'pycharm64.exe'],
    idea: ['idea.exe', 'idea64.exe'],
    // brackets: ['Brackets.exe'],
    // vscodium: ['VSCodium.exe'],
    // sublime_text: [ 'sublime_text.exe', ],
  },
};

// 用户指定了 IDE 时，优先走此处
const getEditorByCustom = (
  editor: keyof typeof CodeMap.mac
): string[] | null => {
  if (process.platform === 'darwin') {
    // mac 系统
    return CodeMap.mac[editor] ? [CodeMap.mac[editor]] : null;
  } else if (process.platform === 'win32') {
    // windows 系统
    return CodeMap.win[editor] ? CodeMap.win[editor] : null;
  } else if (process.platform === 'linux') {
    // linux 系统
    return CodeMap.linux[editor] ? [CodeMap.linux[editor]] : null;
  }
  return null;
};

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
const COMMON_EDITORS_OSX = {
  '/Visual Studio Code.app/': 'code',
  '/Visual Studio Code - Insiders.app/': 'code-insiders',
  '/WebStorm.app/': '/Applications/WebStorm.app/Contents/MacOS/webstorm',
  '/Atom.app/': 'atom',
  '/HBuilderX.app/': '/Applications/HBuilderX.app/Contents/MacOS/HBuilderX',
  '/PhpStorm.app/': '/Applications/PhpStorm.app/Contents/MacOS/phpstorm',
  '/PyCharm.app/': '/Applications/PyCharm.app/Contents/MacOS/pycharm',
  '/PyCharm CE.app/': '/Applications/PyCharm CE.app/Contents/MacOS/pycharm',
  '/IntelliJ IDEA.app/': '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea',
};

const COMMON_EDITORS_LINUX = {
  code: 'code',
  'code-insiders': 'code-insiders',
  'webstorm.sh': 'webstorm',
  atom: 'atom',
  hbuilderx: 'hbuilderx',
  'hbuilderx.sh': 'hbuilderx',
  'phpstorm.sh': 'phpstorm',
  'pycharm.sh': 'pycharm',
  'idea.sh': 'idea',
};

const COMMON_EDITORS_WIN = [
  'Code.exe',
  'Code - Insiders.exe',
  'webstorm.exe',
  'webstorm64.exe',
  'atom.exe',
  'HBuilderX.exe',
  'HBuilder.exe',
  'HBuilderX64.exe',
  'HBuilder64.exe',
  'phpstorm.exe',
  'phpstorm64.exe',
  'pycharm.exe',
  'pycharm64.exe',
  'idea.exe',
  'idea64.exe',
];

const COMMON_EDITORS_WIN_MAP: { [key: string]: string } = {
  'Code.exe': 'code',
  'Code - Insiders.exe': 'code-insiders',
};

// Transpiled version of: /^([A-Za-z]:[/\\])?[\p{L}0-9/.\-_\\]+$/u
// Non-transpiled version requires support for Unicode property regex. Allows
// alphanumeric characters, periods, dashes, slashes, and underscores.

function addWorkspaceToArgumentsIfExists(args: any[], workspace: any) {
  if (workspace) {
    args.unshift(workspace);
  }
  return args;
}

function getArgumentsForLineNumber(
  editor: any,
  fileName: string,
  lineNumber: string,
  colNumber: string,
  workspace: null,
  openWindowParams: string,
  pathFormat?: string | string[]
) {
  const editorBasename = path.basename(editor).replace(/\.(exe|cmd|bat)$/i, '');
  switch (editorBasename) {
    case 'atom':
    case 'Atom':
    case 'Atom Beta':
    case 'subl':
    case 'sublime':
    case 'sublime_text':
      return formatOpenPath(
        fileName,
        lineNumber,
        colNumber,
        pathFormat || `${FormatFile}:${FormatLine}:${FormatColumn}`
      );
    case 'wstorm':
    case 'charm':
      return formatOpenPath(
        fileName,
        lineNumber,
        colNumber,
        pathFormat || `${FormatFile}:${FormatLine}`
      );
    case 'notepad++':
      return formatOpenPath(
        fileName,
        lineNumber,
        colNumber,
        pathFormat || ['-n' + FormatLine, '-c' + FormatColumn, FormatFile]
      );
    case 'vim':
    case 'mvim':
    case 'joe':
    case 'gvim':
      return formatOpenPath(
        fileName,
        lineNumber,
        colNumber,
        pathFormat || ['+' + FormatLine, FormatFile]
      );
    case 'emacs':
    case 'emacsclient':
      return formatOpenPath(
        fileName,
        lineNumber,
        colNumber,
        pathFormat || ['+' + FormatLine + ':' + FormatColumn, FormatFile]
      );
    case 'rmate':
    case 'mate':
    case 'mine':
      return formatOpenPath(
        fileName,
        lineNumber,
        colNumber,
        pathFormat || ['--line', FormatLine, FormatFile]
      );
    case 'code':
    case 'Code':
    case 'code-insiders':
    case 'Code - Insiders':
    case 'vscodium':
    case 'VSCodium':
    case 'HBuilderX':
    case 'HBuilder':
      return addWorkspaceToArgumentsIfExists(
        formatOpenPath(
          fileName,
          lineNumber,
          colNumber,
          pathFormat || [
            '-g',
            ...(openWindowParams ? [openWindowParams] : []),
            `${FormatFile}:${FormatLine}:${FormatColumn}`,
          ]
        ),
        workspace
      );
    case 'appcode':
    case 'clion':
    case 'clion64':
    case 'idea':
    case 'idea64':
    case 'phpstorm':
    case 'phpstorm64':
    case 'pycharm':
    case 'pycharm64':
    case 'rubymine':
    case 'rubymine64':
    case 'webstorm':
    case 'webstorm64':
    case 'goland':
    case 'goland64':
    case 'rider':
    case 'rider64':
      return addWorkspaceToArgumentsIfExists(
        formatOpenPath(
          fileName,
          lineNumber,
          colNumber,
          pathFormat || ['--line', FormatLine, FormatFile]
        ),
        workspace
      );
  }

  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return formatOpenPath(
    fileName,
    lineNumber,
    colNumber,
    pathFormat || '{file}'
  );
}

function getEnvFormatPath() {
  // webpack
  if (process.env.CODE_INSPECTOR_FORMAT_PATH) {
    try {
      return JSON.parse(process.env.CODE_INSPECTOR_FORMAT_PATH);
    } catch (error) {
      return null;
    }
  }

  // vite
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const envConfig = dotenv.parse(envFile || '');
    if (envConfig.CODE_INSPECTOR_FORMAT_PATH) {
      try {
        return JSON.parse(envConfig.CODE_INSPECTOR_FORMAT_PATH);
      } catch (error) {
        return null;
      }
    }
  }

  return null;
}

function guessEditor(_editor?: Editor) {
  let customEditors = null;

  // webpack
  if (process.env.CODE_EDITOR) {
    const editor = getEditorByCustom(process.env.CODE_EDITOR as any);
    if (editor) {
      customEditors = editor;
    } else {
      return [process.env.CODE_EDITOR];
    }
  }

  // vite
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath) && !customEditors) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    const envConfig = dotenv.parse(envFile || '');
    if (envConfig.CODE_EDITOR) {
      const editor = getEditorByCustom(envConfig.CODE_EDITOR as any);
      if (editor) {
        customEditors = editor;
      } else {
        return [envConfig.CODE_EDITOR];
      }
    }
  }

  if (_editor && !customEditors) {
    const editor = getEditorByCustom(_editor);
    if (editor) {
      customEditors = editor;
    }
  }

  // We can find out which editor is currently running by:
  // `ps x` on macOS and Linux
  // `Get-Process` on Windows
  try {
    let first: any;

    if (process.platform === 'darwin') {
      const output = child_process.execSync('ps aux', { encoding: 'utf-8' });
      const editorNames = Object.keys(COMMON_EDITORS_OSX);
      for (let i = 0; i < editorNames.length; i++) {
        const editorName = editorNames[i] as keyof typeof COMMON_EDITORS_OSX;
        if (output.indexOf(editorName) !== -1) {
          if (customEditors?.includes(editorName)) {
            // 优先返回用户自定义
            return [COMMON_EDITORS_OSX[editorName]];
          }
          if (!first) {
            first = [COMMON_EDITORS_OSX[editorName]];
          }
        }
      }
    } else if (process.platform === 'win32') {
      // Some processes need elevated rights to get its executable path.
      // Just filter them out upfront. This also saves 10-20ms on the command.
      const output = child_process.execSync(
        'wmic process where "executablepath is not null" get executablepath',
        { encoding: 'utf8' }
      );
      const runningProcesses = output.split('\r\n').map((item) => item.trim());

      for (let i = 0; i < COMMON_EDITORS_WIN.length; i++) {
        const editorName = COMMON_EDITORS_WIN[i];
        const process = runningProcesses.find(
          (process) => path.basename(process) === editorName
        );
        if (process) {
          const processName = path.basename(process);
          if (customEditors?.includes(processName)) {
            return [COMMON_EDITORS_WIN_MAP[processName] || process];
          }
          if (!first) {
            first = [COMMON_EDITORS_WIN_MAP[processName] || process];
          }
        }
      }
    } else if (process.platform === 'linux') {
      // --no-heading No header line
      // x List all processes owned by you
      // -o comm Need only names column
      const output = child_process.execSync('ps -eo comm --sort=comm', {
        encoding: 'utf8',
      });
      const editorNames = Object.keys(COMMON_EDITORS_LINUX);
      let first: any;
      for (let i = 0; i < editorNames.length; i++) {
        const editorName = editorNames[i] as keyof typeof COMMON_EDITORS_LINUX;
        if (output.indexOf(editorName) !== -1) {
          if (customEditors?.includes(editorName)) {
            // 优先返回用户自定义
            return [COMMON_EDITORS_LINUX[editorName]];
          }
          if (!first) {
            first = [COMMON_EDITORS_LINUX[editorName]];
          }
        }
      }
    }
    if (first) {
      return first;
    }
  } catch (error) {
    // Ignore...
  }

  // Last resort, use old skool env vars
  if (process.env.VISUAL) {
    return [process.env.VISUAL];
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR];
  }

  return [null];
}

function printInstructions(fileName: any, errorMessage: string | any[] | null) {
  console.log(
    chalk.red('Could not open ' + path.basename(fileName) + ' in the editor.')
  );
  if (errorMessage) {
    if (errorMessage[errorMessage.length - 1] !== '.') {
      errorMessage += '.';
    }
    console.log(
      chalk.red('The editor process exited with an error: ' + errorMessage)
    );
  }
  console.log(
    'To set up the editor integration, add something like ' +
      chalk.cyan('CODE_EDITOR=code') +
      ' to the ' +
      chalk.green('.env.local') +
      ' file in your project folder,' +
      ' or add ' +
      chalk.green('editor: "code"') +
      ' to CodeInspectorPlugin config, ' +
      'and then restart the development server. Learn more: ' +
      chalk.green('https://goo.gl/MMTaZt')
  );
}

let _childProcess:
  | {
      kill: (arg0: string) => void;
      on: (
        arg0: string,
        arg1: { (errorCode: any): void; (error: any): void }
      ) => void;
    }
  | any
  | null = null;

function getOpenWindowParams(ideOpenMethod?: IDEOpenMethod) {
  if (ideOpenMethod === 'reuse') {
    return '-r';
  } else if (ideOpenMethod === 'new') {
    return '-n';
  } else {
    return '';
  }
}

function launchEditor(
  fileName: string,
  lineNumber: unknown,
  colNumber: unknown,
  _editor?: Editor,
  ideOpenMethod?: IDEOpenMethod,
  pathFormat?: string | string[]
) {
  if (!fs.existsSync(fileName)) {
    return;
  }

  // Sanitize lineNumber to prevent malicious use on win32
  // via: https://github.com/nodejs/node/blob/c3bb4b1aa5e907d489619fb43d233c3336bfc03d/lib/child_process.js#L333
  // and it should be a positive integer
  // @ts-ignore
  if (!(Number.isInteger(lineNumber) && lineNumber > 0)) {
    return;
  }

  // colNumber is optional, but should be a positive integer too
  // default is 1
  // @ts-ignore
  if (!(Number.isInteger(colNumber) && colNumber > 0)) {
    colNumber = 1;
  }

  let [editor, ...args] = guessEditor(_editor);

  // 获取 path format
  pathFormat = getEnvFormatPath() || pathFormat;

  if (!editor || editor.toLowerCase() === 'none') {
    console.log(
      'Failed to recognize IDE automatically, add something like ' +
        chalk.cyan('CODE_EDITOR=code') +
        ' to the ' +
        chalk.green('.env.local') +
        ' file in your project folder,' +
        ' or add ' +
        chalk.green('editor: "code"') +
        ' to CodeInspectorPlugin config, ' +
        'and then restart the development server. Learn more: ' +
        chalk.green('https://goo.gl/MMTaZt')
    );
    return;
  }

  if (
    process.platform === 'linux' &&
    fileName.startsWith('/mnt/') &&
    /Microsoft/i.test(os.release())
  ) {
    // Assume WSL / "Bash on Ubuntu on Windows" is being used, and
    // that the file exists on the Windows file system.
    // `os.release()` is "4.4.0-43-Microsoft" in the current release
    // build of WSL, see: https://github.com/Microsoft/BashOnWindows/issues/423#issuecomment-221627364
    // When a Windows editor is specified, interop functionality can
    // handle the path translation, but only if a relative path is used.
    fileName = path.relative('', fileName);
  }

  let workspace = null;
  if (lineNumber) {
    args = args.concat(
      getArgumentsForLineNumber(
        editor,
        fileName,
        // @ts-ignore
        lineNumber,
        colNumber,
        workspace,
        getOpenWindowParams(ideOpenMethod),
        pathFormat
      )
    );
  } else {
    args.push(fileName);
  }

  if (_childProcess && isTerminalEditor(editor)) {
    // There's an existing editor process already and it's attached
    // to the terminal, so go kill it. Otherwise two separate editor
    // instances attach to the stdin/stdout which gets confusing.
    _childProcess.kill('SIGKILL');
  }

  if (process.platform === 'win32') {
    // On Windows, launch the editor in a shell because spawn can only
    // launch .exe files.
    _childProcess = child_process.spawn(
      'cmd.exe',
      ['/C', editor].concat(args),
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: '',
        },
      }
    );
  } else {
    _childProcess = child_process.spawn(editor, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '',
      },
    });
  }
  // @ts-ignore
  _childProcess.on('exit', function (errorCode: string) {
    _childProcess = null;

    if (errorCode) {
      printInstructions(fileName, '(code ' + errorCode + ')');
    }
  });

  // @ts-ignore
  _childProcess.on('error', function (error: { message: any }) {
    printInstructions(fileName, error.message);
  });
}

export default launchEditor;
