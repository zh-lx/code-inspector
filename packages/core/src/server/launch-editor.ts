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
  darwin: {
    [key in Editor]: string[];
  };
  linux: {
    [key in Editor]: string[];
  };
  win32: {
    [key in Editor]: string[];
  };
};

const CodeMap: CodeMapType = {
  darwin: {
    code: ['/Visual Studio Code.app/'], // confirmed
    code_insiders: ['/Visual Studio Code - Insiders.app/'], // confirmed
    webstorm: ['/WebStorm.app/'], // confirmed
    cursor: ['/Cursor.app/'],
    atom: ['/Atom.app/'], // confirmed
    hbuilder: ['/HBuilderX.app/'], // confirmed
    phpstorm: ['/PhpStorm.app/'], // confirmed
    pycharm: ['/PyCharm.app/'], // confirmed
    idea: ['/IntelliJ IDEA.app/'], // confirmed
    codium: ['/VSCodium.app/'], // cant't open the specific line and column
    // sublime_text: ['/Applications/Sublime Text.app/Contents/MacOS/sublime_text'], // can't open the opened project
    // brackets: ['/Applications/Brackets.app/Contents/MacOS/Brackets'], // can't open file
  },
  linux: {
    code: ['code'],
    code_insiders: ['code-insiders'],
    webstorm: ['webstorm.sh'],
    cursor: ['cursor'],
    atom: ['atom'],
    hbuilder: ['hbuilderx.sh'],
    phpstorm: ['phpstorm.sh'],
    pycharm: ['pycharm.sh'],
    idea: ['idea.sh'],
    codium: ['vscodium'],
    // brackets: ['brackets'],
    // sublime_text: ['sublime_text'],
  },
  win32: {
    code: ['Code.exe'], // confirmed
    code_insiders: ['Code - Insiders.exe'],
    webstorm: ['webstorm.exe', 'webstorm64.exe'],
    cursor: ['Cursor.exe'],
    atom: ['atom.exe'],
    hbuilder: ['HBuilderX.exe', 'HBuilder.exe'],
    phpstorm: ['phpstorm.exe', 'phpstorm64.exe'],
    pycharm: ['pycharm.exe', 'pycharm64.exe'],
    idea: ['idea.exe', 'idea64.exe'],
    codium: ['VSCodium.exe'],
    // brackets: ['Brackets.exe'],
    // sublime_text: ['sublime_text.exe'],
  },
};

const ProcessExectionMap = {
  darwin: 'ps aux',
  linux: 'ps -eo comm --sort=comm',
  win32: 'wmic process where "executablepath is not null" get executablepath',
}

// 用户指定了 IDE 时，优先走此处
const getEditorByCustom = (
  editor: keyof typeof CodeMap.darwin
): string[] | null => {
  const platform = process.platform as keyof CodeMapType;
  return (CodeMap[platform] && CodeMap[platform][editor]) || null;
};

// Map from full process name to binary that starts the process
// We can't just re-use full process name, because it will spawn a new instance
// of the app every time
const COMMON_EDITORS_OSX = {
  '/Visual Studio Code.app/': 'code',
  '/Visual Studio Code - Insiders.app/': 'code-insiders',
  '/VSCodium.app/': 'codium',
  '/WebStorm.app/': '/Applications/WebStorm.app/Contents/MacOS/webstorm',
  '/Cursor.app/': '/Applications/Cursor.app/Contents/MacOS/Cursor',
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
  codium: 'codium',
  vscodium: 'vscodium',
  'webstorm.sh': 'webstorm',
  'cursor': 'cursor',
  atom: 'atom',
  hbuilderx: 'hbuilderx',
  'hbuilderx.sh': 'hbuilderx',
  'phpstorm.sh': 'phpstorm',
  'pycharm.sh': 'pycharm',
  'idea.sh': 'idea',
};

const COMMON_EDITORS_WIN: { [key: string]: string } = {
  'Code.exe': 'code',
  'Code - Insiders.exe': 'code-insiders',
  'VSCodium.exe': 'codium',
  'webstorm.exe': '',
  'webstorm64.exe': '',
  'Cursor.exe': 'cursor',
  'atom.exe': '',
  'HBuilderX.exe': '',
  'HBuilder.exe': '',
  'HBuilderX64.exe': '',
  'HBuilder64.exe': '',
  'phpstorm.exe': '',
  'phpstorm64.exe': '',
  'pycharm.exe': '',
  'pycharm64.exe': '',
  'idea.exe': '',
  'idea64.exe': '',
};

const COMMON_EDITORS_MAP = {
  darwin: COMMON_EDITORS_OSX,
  linux: COMMON_EDITORS_LINUX,
  win32: COMMON_EDITORS_WIN,
};

function getArgumentsForLineNumber(
  editor: string,
  fileName: string,
  lineNumber: string,
  colNumber: string,
  workspace: string | null,
  openWindowParams: string,
  pathFormat?: string | string[]
) {
  const params = { editor, openWindowParams, workspace };
  const format =
    getFormatByEditor(params) || getDefaultPathFormat(params) || '{file}';
  // For all others, drop the lineNumber until we have
  // a mapping above, since providing the lineNumber incorrectly
  // can result in errors or confusing behavior.
  return formatOpenPath(fileName, lineNumber, colNumber, pathFormat || format);
}
interface GetEditorFormatParams {
  editor: string;
  openWindowParams?: string;
  workspace?: string | null;
}

// 已知 editor，返回对应 format
function getFormatByEditor(params: GetEditorFormatParams) {
  const { editor, openWindowParams, workspace } = params;
  const editorBasename = path.basename(editor).replace(/\.(exe|cmd|bat)$/i, '');
  switch (editorBasename) {
    case 'atom':
    case 'Atom':
    case 'Atom Beta':
    case 'subl':
    case 'sublime':
    case 'sublime_text':
      return `${FormatFile}:${FormatLine}:${FormatColumn}`;
    case 'wstorm':
    case 'charm':
      return `${FormatFile}:${FormatLine}`;
    case 'notepad++':
      return ['-n' + FormatLine, '-c' + FormatColumn, FormatFile];
    case 'vim':
    case 'mvim':
    case 'joe':
    case 'gvim':
      return ['+' + FormatLine, FormatFile];
    case 'emacs':
    case 'emacsclient':
      return ['+' + FormatLine + ':' + FormatColumn, FormatFile];
    case 'rmate':
    case 'mate':
    case 'mine':
      return ['--line', FormatLine, FormatFile];
    case 'code':
    case 'Code':
    case 'code-insiders':
    case 'Code - Insiders':
    case 'codium':
    case 'Codium':
    case 'Cursor':
    case 'cursor':
    case 'vscodium':
    case 'VSCodium':
    case 'HBuilderX':
    case 'HBuilder':
      return [
        ...(workspace ? [workspace] : []),
        '-g',
        ...(openWindowParams ? [openWindowParams] : []),
        `${FormatFile}:${FormatLine}:${FormatColumn}`,
      ];
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
      return [
        ...(workspace ? [workspace] : []),
        '--line',
        FormatLine,
        FormatFile,
      ];
  }
  return '';
}

// 根据用户自定义 editor 路径，返回对应 format
function getDefaultPathFormat(params: GetEditorFormatParams) {
  const { editor } = params;
  let editorBasename: string | undefined = editor;
  const commonEditors =
    COMMON_EDITORS_MAP[process.platform as keyof typeof COMMON_EDITORS_MAP];
  if (commonEditors) {
    const key = Object.keys(commonEditors).find((key) => editor.includes(key));
    if (key) {
      editorBasename = commonEditors[key as keyof typeof commonEditors] || key;
    }
  }
  return getFormatByEditor({ ...params, editor: editorBasename });
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
    let first: string[] | undefined;

    const platform = process.platform as 'darwin' | 'linux' | 'win32';

    const execution = ProcessExectionMap[platform];
    const commonEditors = COMMON_EDITORS_MAP[platform];
    const output = child_process.execSync(execution, { encoding: 'utf-8' });
    const editorNames = Object.keys(commonEditors);
    const runningProcesses = output.split('\r\n').map((item) => item.trim()); // 仅 win32

    for (let i = 0; i < editorNames.length; i++) {
      const editorName = editorNames[i] as keyof typeof commonEditors;
      let editor: string = ''; // 要返回的 editor 结果
      let runningEditor: string = ''; // 正在运行的 editor 进程名称

      // 检测当前 editorName 是否正在运行
      if (platform === 'win32') {
        const process = runningProcesses.find(
          (process) => path.basename(process) === editorName
        );
        if (process) {
          runningEditor = path.basename(process);
          editor = COMMON_EDITORS_WIN[runningEditor] || process;
        }
      } else {
        if (output.indexOf(editorName) !== -1) {
          runningEditor = editorName;
          editor = commonEditors[editorName];
        }
      }
      
      if (runningEditor && editor) {
        if (customEditors?.includes(runningEditor)) {
          // 优先返回用户自定义的 editor
          return [editor];
        }
        if (!first) {
          first = [editor];
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
      ['/C', editor].concat(args as string[]),
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_OPTIONS: '',
        },
      }
    );
  } else {
    _childProcess = child_process.spawn(editor, args as string[], {
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
