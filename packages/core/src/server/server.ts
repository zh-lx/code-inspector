/**
 * 本地服务器模块 - 处理 IDE 打开和 AI 请求
 */
import http from 'http';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import portFinder from 'portfinder';
import { launchIDE } from 'launch-ide';
import { DefaultPort } from '../shared/constant';
import { getIP } from '../shared';
import type { CodeOptions, RecordInfo } from '../shared';
import {
  clearServerRuntimeState,
  getServerRuntimeState,
  publishServerRuntimeState,
} from '../shared/server-state';
import {
  SERVER_PROTOCOL_VERSION,
  getProjectId,
  getRuntimeDirectory,
} from '../shared/runtime-path';
import {
  releaseServerStartupLock,
  tryAcquireServerStartupLock,
} from './server-lock';
import {
  handleAIRequest,
  getAIOptions,
  handleAIModelRequest,
  handleAIRevertRequest,
  getExpireDays,
  handleAIRuntimeAbortRequest,
  handleAIRuntimeStreamRequest,
} from '../ai/server/ai';
import {
  handleAIHistoryListRequest,
  handleAIHistorySaveRequest,
  handleAIHistoryLoadRequest,
  handleAIHistoryDeleteRequest,
} from '../ai/server/ai-history';
import {
  attachTerminalWebSocket,
  getTerminalAvailabilityStatus,
} from '../ai/server/ai-terminal';
import { getEnvVariables } from 'launch-ide';
import { isAuthorizedAIRequest } from '../ai/server/ai-auth';

const HEALTH_CHECK_PATH = '/__code_inspector_health';
const HEALTH_CHECK_TIMEOUT_MS = 500;
const SERVER_START_TIMEOUT_MS = 10_000;
const SERVER_COORDINATION_TIMEOUT_MS = 30_000;
const SERVER_COORDINATION_POLL_MS = 100;
// Share startup work within this process; startup.lock coordinates other processes.
const serverStartupPromises = new Map<string, Promise<void>>();

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
  } catch (error) {
    return '';
  }
}

export function getEnvVars(): Record<string, string> {
  const projectRoot = getProjectRoot();
  if (projectRoot) {
    return getEnvVariables(projectRoot);
  }
  return process.env as Record<string, string>;
}

/** 项目根目录 */
export const ProjectRootPath = getProjectRoot();

/**
 * 获取相对路径
 */
export function getRelativePath(filePath: string): string {
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
  pathType?: 'relative' | 'absolute',
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
  record?: RecordInfo,
): void {
  const params = new URLSearchParams(req.url?.slice(1) || '');
  const fileParam = params.get('file');
  let file: string;

  try {
    if (!fileParam) {
      throw new URIError('Missing file parameter');
    }
    file = decodeURIComponent(fileParam);
  } catch {
    res.writeHead(400, CORS_HEADERS);
    res.end('invalid file parameter');
    return;
  }

  if (ProjectRootPath && !path.isAbsolute(file)) {
    file = path.resolve(ProjectRootPath, file);
  }

  // 安全检查：相对路径模式下不允许访问项目外的文件
  if (options?.pathType === 'relative' && ProjectRootPath) {
    const projectRoot = path.resolve(ProjectRootPath);
    const relativePath = path.relative(projectRoot, path.resolve(file));
    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath)
    ) {
      res.writeHead(403, CORS_HEADERS);
      res.end('not allowed to open this file');
      return;
    }
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
  record?: RecordInfo,
  onError?: (error: Error) => void,
): http.Server {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === HEALTH_CHECK_PATH && req.method === 'GET') {
      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      });
      res.end(
        JSON.stringify({
          name: 'code-inspector',
          // Callers verify project and protocol; an occupied port alone is insufficient.
          projectId: getProjectId(),
          protocolVersion: SERVER_PROTOCOL_VERSION,
        }),
      );
      return;
    }

    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(200, CORS_HEADERS);
      res.end();
      return;
    }

    const isAIRoute = pathname === '/ai' || pathname.startsWith('/ai/');
    if (isAIRoute && !isAuthorizedAIRequest(url)) {
      res.writeHead(403, CORS_HEADERS);
      res.end('Forbidden');
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
      await handleAIModelRequest(
        res,
        CORS_HEADERS,
        aiOptions,
        url.searchParams.get('provider'),
      );
      return;
    }

    // 处理 /ai/revert 路由
    if (pathname === '/ai/revert' && req.method === 'POST') {
      await handleAIRevertRequest(req, res, CORS_HEADERS, ProjectRootPath);
      return;
    }

    if (pathname === '/ai/runtime' && req.method === 'GET') {
      await handleAIRuntimeStreamRequest(
        res,
        CORS_HEADERS,
        url.searchParams.get('runtimeSessionId'),
        url.searchParams.get('cursor'),
      );
      return;
    }

    if (pathname === '/ai/runtime/abort' && req.method === 'POST') {
      await handleAIRuntimeAbortRequest(req, res, CORS_HEADERS);
      return;
    }

    // 处理 /ai/terminal/status 路由
    if (pathname === '/ai/terminal/status' && req.method === 'GET') {
      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(getTerminalAvailabilityStatus()));
      return;
    }

    // 处理 /ai/history 路由
    if (pathname === '/ai/history' && req.method === 'GET') {
      const expireDays = getExpireDays(options?.behavior);
      await handleAIHistoryListRequest(
        res,
        CORS_HEADERS,
        ProjectRootPath,
        expireDays,
      );
      return;
    }

    if (pathname === '/ai/history/save' && req.method === 'POST') {
      await handleAIHistorySaveRequest(req, res, CORS_HEADERS, ProjectRootPath);
      return;
    }

    if (pathname === '/ai/history/load' && req.method === 'POST') {
      await handleAIHistoryLoadRequest(req, res, CORS_HEADERS, ProjectRootPath);
      return;
    }

    if (pathname === '/ai/history/delete' && req.method === 'POST') {
      await handleAIHistoryDeleteRequest(
        req,
        res,
        CORS_HEADERS,
        ProjectRootPath,
      );
      return;
    }

    // 处理 IDE 打开请求
    handleIDERequest(req, res, options, record);
  });

  // 挂载终端 WebSocket（异步初始化，不阻塞服务器启动）
  void attachTerminalWebSocket(
    server,
    () => getAIOptions(options?.behavior),
    ProjectRootPath,
  ).catch(() => {
    // ignore terminal feature init errors
  });

  // 寻找可用端口
  __TEST_ONLY__.getPort(
    { port: options?.port ?? DefaultPort },
    (err: Error, port: number) => {
      if (err) {
        if (onError) {
          onError(err);
        } else {
          throw err;
        }
        return;
      }
      if (onError) {
        server.once('error', onError);
      }
      server.listen(port, () => {
        callback(port);
      });
    },
  );

  return server;
}

// For tests: allow replacing server bootstrap implementation without touching runtime behavior.
export const __TEST_ONLY__ = {
  createServer,
  getPort: portFinder.getPort.bind(portFinder),
  isInspectorServer,
};

async function isInspectorServer(
  port: number,
  projectId: string,
): Promise<boolean> {
  // Runtime state is only a hint; verify a compatible server before reusing its port.
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: HEALTH_CHECK_PATH,
        timeout: HEALTH_CHECK_TIMEOUT_MS,
      },
      (response) => {
        let body = '';
        response.setEncoding('utf-8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            const result = JSON.parse(body);
            finish(
              response.statusCode === 200 &&
                result.name === 'code-inspector' &&
                result.projectId === projectId &&
                result.protocolVersion === SERVER_PROTOCOL_VERSION,
            );
          } catch {
            finish(false);
          }
        });
      },
    );
    request.on('timeout', () => {
      request.destroy();
      finish(false);
    });
    request.on('error', () => finish(false));
  });
}

function createServerAndWait(
  options: CodeOptions,
  record: RecordInfo,
): Promise<number> {
  // Wrap callback-based startup to handle port lookup, listen errors, and timeout alike.
  return new Promise((resolve, reject) => {
    let settled = false;
    let server: http.Server | undefined;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      server?.close();
      reject(new Error('Timed out starting the code-inspector server.'));
    }, SERVER_START_TIMEOUT_MS);
    const finish = (error?: Error, port?: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) {
        reject(error);
      } else {
        resolve(port as number);
      }
    };

    try {
      server = __TEST_ONLY__.createServer(
        (port) => finish(undefined, port),
        options,
        record,
        (error) => finish(error),
      );
    } catch (error) {
      finish(error as Error);
    }
  });
}

async function coordinateServerStartup(
  options: CodeOptions,
  record: RecordInfo,
) {
  const projectId = getProjectId();
  const deadline = Date.now() + SERVER_COORDINATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    // Fast path: another caller may already have started and published the server.
    const currentState = getServerRuntimeState(record);
    const currentPort = currentState?.port;
    if (
      currentPort &&
      (await __TEST_ONLY__.isInspectorServer(currentPort, projectId))
    ) {
      return;
    }
    const lock = tryAcquireServerStartupLock(record);
    if (lock) {
      try {
        // State may change while waiting for the lock, so check again before starting.
        const publishedState = getServerRuntimeState(record);
        const publishedPort = publishedState?.port;
        if (
          publishedPort &&
          (await __TEST_ONLY__.isInspectorServer(publishedPort, projectId))
        ) {
          return;
        }

        // Replace stale state only while holding the lock, then publish the new instance.
        clearServerRuntimeState(record, publishedState?.instanceId);
        const port = await createServerAndWait(options, record);
        publishServerRuntimeState(record, port, lock.token);
        if (options.printServer) {
          const info = [
            chalk.blue('[code-inspector-plugin]'),
            'Server is running on:',
            chalk.green(`http://${getIP(options.ip || 'localhost')}:${port}`),
          ];
          console.log(info.join(' '));
        }
        return;
      } catch (error) {
        clearServerRuntimeState(record, lock.token);
        throw error;
      } finally {
        releaseServerStartupLock(lock);
      }
    }

    await new Promise((resolve) =>
      setTimeout(resolve, SERVER_COORDINATION_POLL_MS),
    );
  }

  throw new Error('Timed out coordinating the code-inspector server startup.');
}

/**
 * 启动服务器
 */
export async function startServer(
  options: CodeOptions,
  record: RecordInfo,
): Promise<void> {
  // Use the same canonical identity as the cross-process lock and runtime state.
  const key = getRuntimeDirectory(record.output);
  let startupPromise = serverStartupPromises.get(key);

  if (!startupPromise) {
    startupPromise = coordinateServerStartup(options, record);
    serverStartupPromises.set(key, startupPromise);
  }

  try {
    await startupPromise;
  } finally {
    // Delete only our entry so an older task cannot remove a newer startup attempt.
    if (serverStartupPromises.get(key) === startupPromise) {
      serverStartupPromises.delete(key);
    }
  }
}
