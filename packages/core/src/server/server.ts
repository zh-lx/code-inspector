// 启动本地接口，访问时唤起vscode
import http, { Server } from 'http';
import portFinder from 'portfinder';
import { launchIDE } from 'launch-ide';
import { DefaultPort } from '../shared/constant';
import { getIP } from '../shared';
import type { PathType, CodeOptions, RecordInfo } from '../shared';
import { execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';

// 获取项目 git 根目录
function getProjectRoot(): string {
  try {
    const command = 'git rev-parse --show-toplevel';
    const gitRoot = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return gitRoot;
  } catch (error) {
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

// 根据用户配置返回绝对路径或者相对路径
export function getRelativeOrAbsolutePath(
  filePath: string,
  pathType?: PathType
) {
  return pathType === 'relative' ? getRelativePath(filePath) : filePath;
}

export function createServer(
  callback: (port: number) => any,
  options?: CodeOptions
) {
  const server = http.createServer((req: any, res: any) => {
    // 收到请求唤醒vscode
    const params = new URLSearchParams(req.url.slice(1));
    let file = decodeURIComponent(params.get('file') as string);
    if (ProjectRootPath && !path.isAbsolute(file)) {
      file = `${ProjectRootPath}/${file}`;
    }
    if (
      options?.pathType === 'relative' &&
      ProjectRootPath &&
      !file.startsWith(ProjectRootPath)
    ) {
      res.writeHead(403, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Private-Network': 'true',
      });
      res.end('not allowed to open this file');
      return;
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
  portFinder.getPort(
    { port: options?.port ?? DefaultPort },
    (err: Error, port: number) => {
      if (err) {
        throw err;
      }
      server.listen(port, () => {
        callback(port);
      });
    }
  );
  return server;
}

// record the server of each project
const projectServerMap = new Map<string, Server>();

export async function startServer(options: CodeOptions, record: RecordInfo) {
  if (!record.port) {
    if (!record.findPort) {
      record.findPort = new Promise((resolve) => {
        // get current project path
        const projectName = process.cwd();
        // close the previous server
        if (projectServerMap.has(projectName)) {
          (projectServerMap.get(projectName) as Server)?.close();
        }
        // create server
        const server = createServer((port: number) => {
          resolve(port);
          if (options.printServer) {
            console.log(
              chalk.blue(`[code-inspector-plugin] `) +
                chalk.white(`Server is running on: `) +
                chalk.green(
                  `http://${getIP(options.ip || 'localhost')}:${
                    options.port ?? DefaultPort
                  }`
                )
            );
          }
        }, options);
        // record the server of current project
        projectServerMap.set(projectName, server);
      });
    }
    record.port = await record.findPort;
  }
}
