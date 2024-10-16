import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import os from 'os';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { Editor, IDEOpenMethod } from '../../shared';
import { getArguments } from './get-args';
import { guessEditor } from './guess';

function isTerminalEditor(editor: string) {
  switch (editor) {
    case 'vim':
    case 'emacs':
    case 'nano':
      return true;
  }
  return false;
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
  lineNumber: number,
  colNumber: number,
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
  if (!(Number.isInteger(lineNumber) && lineNumber > 0)) {
    return;
  }

  // colNumber is optional, but should be a positive integer too
  // default is 1
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
      getArguments({
        processName: editor,
        fileName,
        lineNumber,
        colNumber,
        workspace,
        openWindowParams: getOpenWindowParams(ideOpenMethod),
        pathFormat,
      })
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
    // this two funcs according to launch-editor
    // compatible for some special characters
    const escapeCmdArgs = (cmdArgs: string | null) => {
      return cmdArgs!.replace(/([&|<>,;=^])/g, '^$1');
    };
    const doubleQuoteIfNeeded = (str: string | null) => {
      if (str!.includes('^')) {
        return `^"${str}^"`;
      } else if (str!.includes(' ')) {
        return `"${str}"`;
      }
      return str;
    };

    const launchCommand = [editor, ...args.map(escapeCmdArgs)]
      .map(doubleQuoteIfNeeded)
      .join(' ');

    _childProcess = child_process.exec(launchCommand, {
      stdio: 'inherit',
      // @ts-ignore
      shell: true,
      env: {
        ...process.env,
        NODE_OPTIONS: '',
      },
    });
  } else {
    _childProcess = child_process.spawn(editor, args as string[], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '',
      },
    });
  }

  _childProcess.on('exit', function (errorCode: string) {
    _childProcess = null;

    if (errorCode) {
      printInstructions(fileName, '(code ' + errorCode + ')');
    }
  });

  _childProcess.on('error', function (error: { message: any }) {
    printInstructions(fileName, error.message);
  });
}

export default launchEditor;
