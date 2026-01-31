// 启动本地接口，访问时唤起vscode
import http from 'http';
import path from 'path';
import chalk from 'chalk';
import net from 'net';
import { execSync } from 'child_process';
import portFinder from 'portfinder';
import { launchIDE } from 'launch-ide';
import { DefaultPort } from '../shared/constant';
import { getIP, getProjectRecord, setProjectRecord, findPort } from '../shared';
import type { PathType, CodeOptions, RecordInfo } from '../shared';

// 获取项目 git 根目录
function getProjectRoot(): string {
  try {
    const command = 'git rev-parse --show-toplevel';
    const gitRoot = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return gitRoot;
  /* v8 ignore next 3 -- only runs when not in a git repo */
  } catch (error) {
    return '';
  }
}

// 项目根目录
export const ProjectRootPath = getProjectRoot();
export function getRelativePath(filePath: string): string {
  /* v8 ignore next 5 -- branch depends on git repo presence at module load time */
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
  options?: CodeOptions,
  record?: RecordInfo
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
      rootDir: record?.envDir,
      type: options?.launchType,
    });
  });

  // 寻找可用接口
  portFinder.getPort(
    { port: options?.port ?? DefaultPort },
    (err: Error, port: number) => {
      /* v8 ignore next 3 -- error thrown in callback, tested via integration */
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

/**
 * Check if a port is occupied (in use)
 * @param port - The port number to check
 * @returns Promise<boolean> - true if port is occupied, false if available
 */
async function isPortOccupied(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Create TCP server to test port availability
    const server = net.createServer();
    // Disable default connection listening (only for detecting port)
    server.unref();

    // Port is available - we can bind to it
    server.on('listening', () => {
      server.close(); // Immediately close server, release port
      resolve(false); // Port is NOT occupied
    });

    // Port is occupied - binding failed
    server.on('error', () => {
      resolve(true); // Port IS occupied
    });

    server.listen(port);
  });
}

export async function startServer(options: CodeOptions, record: RecordInfo) {
  const previousPort = getProjectRecord(record)?.port;
  if (previousPort) {
    const isOccupied = await isPortOccupied(previousPort);
    if (isOccupied) {
      // Port is occupied, server is already running
      return;
    }
    // Port is available, need to restart server
    setProjectRecord(record, 'findPort', undefined);
    setProjectRecord(record, 'port', undefined);
  }
  let restartServer = !getProjectRecord(record)?.findPort;

  if (restartServer) {
    const findPort = new Promise<number>((resolve) => {
      // create server
      createServer(
        (port: number) => {
          resolve(port);
          if (options.printServer) {
            const info = [
              chalk.blue('[code-inspector-plugin]'),
              'Server is running on:',
              chalk.green(
                `http://${getIP(options.ip || 'localhost')}:${
                  options.port ?? DefaultPort
                }`
              ),
            ];
            console.log(info.join(' '));
          }
        },
        options,
        record
      );
    });
    // record the server of current project
    setProjectRecord(record, 'findPort', 1);
    const port = await findPort;
    setProjectRecord(record, 'port', port);
  }

  if (!getProjectRecord(record)?.port) {
    const port = await findPort(record);
    setProjectRecord(record, 'port', port);
  }
}
