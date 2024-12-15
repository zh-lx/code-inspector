// 启动本地接口，访问时唤起vscode
import http from 'http';
import portFinder from 'portfinder';
import { launchIDE } from 'launch-ide';
import { DefaultPort } from '../shared/constant';
import { type CodeOptions, type RecordInfo } from '../shared';
import { execSync } from 'child_process';
import path from 'path';

// 获取项目 git 根目录
function getProjectRoot(): string {
  try {
    const command = 'git rev-parse --show-toplevel';
    const gitRoot = execSync(command, { encoding: 'utf-8' }).trim();
    return gitRoot;
  } catch (error) {
    console.error(error);
    return '';
  }
}

// 项目根目录
export const ProjectRootPath = getProjectRoot();
export function getRelativePath(filePath: string): string {
  if (ProjectRootPath) {
    return filePath.replace(`${ProjectRootPath}/`, '');
  }
  return filePath;
}

export function createServer(callback: (port: number) => any, options?: CodeOptions) {
  const server = http.createServer((req: any, res: any) => {
    // 收到请求唤醒vscode
    const params = new URLSearchParams(req.url.slice(1));
    let file = decodeURIComponent(params.get('file') as string);
    if (ProjectRootPath && !path.isAbsolute(file)) {
      file = `${ProjectRootPath}/${file}`;
    }
    const line = Number(params.get('line'));
    const column = Number(params.get('column'));
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Private-Network': 'true',
    });
    res.end('ok');
    // 调用 hooks
    options?.hooks?.afterInspectRequest?.(options, { file, line, column });
    // 打开 IDE
    launchIDE({
      file,
      line,
      column,
      editor: options?.editor,
      method: options?.openIn,
      format: options?.pathFormat,
    });
  });

  // 寻找可用接口
  portFinder.getPort({ port: DefaultPort }, (err: Error, port: number) => {
    if (err) {
      throw err;
    }
    server.listen(port, () => {
      callback(port);
    });
  });
}

export async function startServer(options: CodeOptions, record: RecordInfo) {
  if (!record.port) {
    if (!record.findPort) {
      record.findPort = new Promise((resolve) => {
        createServer((port: number) => {
          resolve(port);
        }, options);
      });
    }
    record.port = await record.findPort;
  }
}
