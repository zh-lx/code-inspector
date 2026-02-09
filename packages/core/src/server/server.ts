/**
 * 本地服务器模块 - 处理 IDE 打开和 AI 请求
 */
import http from 'http';
import path from 'path';
import chalk from 'chalk';
import net from 'net';
import { execSync } from 'child_process';
import portFinder from 'portfinder';
import { launchIDE } from 'launch-ide';
import { DefaultPort } from '../shared/constant';
import { getIP, getProjectRecord, setProjectRecord, findPort } from '../shared';
import type { CodeOptions, RecordInfo } from '../shared';
import { handleAIRequest, getAIOptions, handleAIModelRequest } from './ai';
import { getEnvVariables } from 'launch-ide';

/**
 * 获取项目 git 根目录
 */
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

export function getEnvVars(): Record<string, string> {
  const projectRoot = getProjectRoot();
  if (projectRoot) {
    return getEnvVariables(projectRoot);
  }
  return (process.env || {}) as Record<string, string>;
}

/** 项目根目录 */
export const ProjectRootPath = getProjectRoot();

/**
 * 获取相对路径
 */
export function getRelativePath(filePath: string): string {
  /* v8 ignore next 5 -- branch depends on git repo presence at module load time */
  if (ProjectRootPath) {
    return filePath.replace(`${ProjectRootPath}/`, '');
  }
  return filePath;
}

/**
 * 根据用户配置返回绝对路径或者相对路径
 */
export function getRelativeOrAbsolutePath(
  filePath: string,
  pathType?: 'relative' | 'absolute'
): string {
  return pathType === 'relative' ? getRelativePath(filePath) : filePath;
}

/** CORS 响应头 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Private-Network': 'true',
};

/**
 * 处理 IDE 打开请求
 */
function handleIDERequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  options?: CodeOptions,
  record?: RecordInfo
): void {
  const params = new URLSearchParams(req.url?.slice(1) || '');
  let file = decodeURIComponent(params.get('file') as string);

  if (ProjectRootPath && !path.isAbsolute(file)) {
    file = `${ProjectRootPath}/${file}`;
  }

  // 安全检查：相对路径模式下不允许访问项目外的文件
  if (
    options?.pathType === 'relative' &&
    ProjectRootPath &&
    !file.startsWith(ProjectRootPath)
  ) {
    res.writeHead(403, CORS_HEADERS);
    res.end('not allowed to open this file');
    return;
  }

  const line = Number(params.get('line'));
  const column = Number(params.get('column'));

  res.writeHead(200, CORS_HEADERS);
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
}

/**
 * 创建 HTTP 服务器
 */
export function createServer(
  callback: (port: number) => void,
  options?: CodeOptions,
  record?: RecordInfo
): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(200, CORS_HEADERS);
      res.end();
      return;
    }

    // 处理 /ai 路由
    if (pathname === '/ai' && req.method === 'POST') {
      const aiOptions = getAIOptions(options?.behavior);
      await handleAIRequest(req, res, CORS_HEADERS, aiOptions, ProjectRootPath);
      return;
    }

    // 处理 /ai/model 路由
    if (pathname === '/ai/model' && req.method === 'GET') {
      const aiOptions = getAIOptions(options?.behavior);
      await handleAIModelRequest(res, CORS_HEADERS, aiOptions);
      return;
    }

    // 处理 IDE 打开请求
    handleIDERequest(req, res, options, record);
  });

  // 寻找可用端口
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
 * 检查端口是否被占用
 */
async function isPortOccupied(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();

    server.on('listening', () => {
      server.close();
      resolve(false);
    });

    server.on('error', () => {
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * 启动服务器
 */
export async function startServer(options: CodeOptions, record: RecordInfo): Promise<void> {
  const previousPort = getProjectRecord(record)?.port;

  if (previousPort) {
    const isOccupied = await isPortOccupied(previousPort);
    if (isOccupied) {
      // 端口已被占用，服务器已在运行
      return;
    }
    // 端口可用，需要重启服务器
    setProjectRecord(record, 'findPort', undefined);
    setProjectRecord(record, 'port', undefined);
  }

  const restartServer = !getProjectRecord(record)?.findPort;

  if (restartServer) {
    const portPromise = new Promise<number>((resolve) => {
      createServer(
        (port: number) => {
          resolve(port);
          if (options.printServer) {
            const info = [
              chalk.blue('[code-inspector-plugin]'),
              'Server is running on:',
              chalk.green(
                `http://${getIP(options.ip || 'localhost')}:${options.port ?? DefaultPort}`
              ),
            ];
            console.log(info.join(' '));
          }
        },
        options,
        record
      );
    });

    setProjectRecord(record, 'findPort', 1);
    const port = await portPromise;
    setProjectRecord(record, 'port', port);
  }

  if (!getProjectRecord(record)?.port) {
    const port = await findPort(record);
    setProjectRecord(record, 'port', port);
  }
}
