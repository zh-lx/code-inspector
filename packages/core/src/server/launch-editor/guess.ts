import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import dotenv from 'dotenv';
import {
  Editor,
} from '../../shared';
import { Platform } from './type';
import { COMMON_EDITOR_PROCESS_MAP, COMMON_EDITORS_MAP } from './editor-info';

const ProcessExectionMap = {
  darwin: 'ps ax -o comm=',
  linux: 'ps -eo comm --sort=comm',
  win32: 'powershell -NoProfile -Command "Get-CimInstance -Query \\"select executablepath from win32_process where executablepath is not null\\" | % { $_.ExecutablePath }"',
}

// 用户指定了 IDE 时，优先走此处
const getEditorByCustom = (
  editor: Editor
): string[] | null => {
  const platform = process.platform as Platform;
  return (COMMON_EDITOR_PROCESS_MAP[platform] && COMMON_EDITOR_PROCESS_MAP[platform][editor]) || null;
};

export function guessEditor(_editor?: Editor) {
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

  try {
    let first: string[] | undefined;

    const platform = process.platform as 'darwin' | 'linux' | 'win32';

    const execution = ProcessExectionMap[platform];
    const commonEditors = COMMON_EDITORS_MAP[platform];

    // 兼容 windows 系统 powershell 中文编码不识别问题
    try {
      child_process.execSync('chcp 65001');
    } catch (error) {
      // ignore
    }
    const output = child_process.execSync(execution, { encoding: 'utf-8' });

    const editorNames = Object.keys(commonEditors);
    const runningProcesses = output.split(platform === 'win32' ? '\r\n' : '\n').map((item) => item.trim());

    for (let i = 0; i < editorNames.length; i++) {
      const editorName = editorNames[i] as keyof typeof commonEditors;
      let editor: string = ''; // 要返回的 editor 结果
      let runningEditor: string = ''; // 正在运行的 editor 进程名称

      // 检测当前 editorName 是否正在运行
      if (platform === 'win32') {
        const processPath = runningProcesses.find(
          (_process) => path.basename(_process) === editorName
        );
        if (processPath) {
          runningEditor = path.basename(processPath);
          editor = processPath;
        }
      } else if (platform === 'darwin') {
        const runningProcess = runningProcesses.find((_process) => _process.endsWith(editorName));
        // 命中了 IDE
        if (runningProcess) {
          const prefixPath = runningProcess.replace(editorName, '');
          const processName = commonEditors[editorName] as string;
          runningEditor = editorName;
          if (processName.includes('/')) {
            // 使用 应用进程 路径
            editor = `${prefixPath}${processName}`;
          } else {
            // 使用 CLI 路径
            editor = processName;
          }
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

  if (process.env.VISUAL) {
    return [process.env.VISUAL];
  } else if (process.env.EDITOR) {
    return [process.env.EDITOR];
  }

  return [null];
}