import path from 'path';
import {
  Editor,
  FormatColumn,
  FormatFile,
  FormatLine,
  formatOpenPath,
} from '../../shared';
import { Platform } from './type';
import { COMMON_EDITOR_PROCESS_MAP } from './editor-info';

interface GetEditorFormatParams {
  editorBasename: string;
  openWindowParams?: string; // 在新窗口打开还是复用已有窗口
  workspace?: string | null;
}

// 入口函数：获取打开 IDE 所需要的参数
export function getArguments(params: {
  processName: string,
  fileName: string,
  lineNumber: string | number,
  colNumber: string | number,
  workspace: string | null,
  openWindowParams: string,
  pathFormat?: string | string[]
}): string[] {
  const { processName, fileName, lineNumber, colNumber, workspace, openWindowParams, pathFormat } = params;
  const editorBasename = getEditorBasenameByProcessName(processName);
  const _params = { editorBasename, openWindowParams, workspace };

  const format = getFormatByEditor(_params) || '{file}';

  // 根据 format 替换具体参数
  return formatOpenPath(fileName, lineNumber, colNumber, pathFormat || format);
}

// 根据进程名获取 editor 的 basename
function getEditorBasenameByProcessName(processName: string) {
  let editorBasename = path.basename(processName).replace(/\.(exe|cmd|bat|sh)$/i, '');

  const platform = process.platform as Platform;
  const editorBasenames = Object.keys(COMMON_EDITOR_PROCESS_MAP[platform]);
  for (let i = 0; i < editorBasenames.length; i++) {
    const editorPaths = COMMON_EDITOR_PROCESS_MAP[platform][editorBasenames[i] as Editor] || [];
    if (editorPaths.some(editorPath => processName.endsWith(editorPath))) {
      editorBasename = editorBasenames[i];
      break;
    }
  }

  return editorBasename.toLowerCase();
}


// 已知 editor，返回对应 format
function getFormatByEditor(params: GetEditorFormatParams) {
  const { editorBasename, openWindowParams, workspace } = params;
  
  switch (editorBasename) {
    case 'atom':
    case 'atom beta':
    case 'subl':
    case 'sublime':
    case 'sublime_text':
    case 'wstorm':
    case 'charm':
    case 'zed':
      return `${FormatFile}:${FormatLine}:${FormatColumn}`;
    case 'notepad++':
      return ['-n' + FormatLine, '-c' + FormatColumn, FormatFile];
    case 'vim':
    case 'mvim':
      return [`+call cursor(${FormatLine}, ${FormatColumn})`, FormatFile]
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
    case 'code-insiders':
    case 'code - insiders':
    case 'codium':
    case 'cursor':
    case 'vscodium':
    case 'hbuilderx':
    case 'hbuilder':
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