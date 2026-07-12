import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import treeKill from 'tree-kill';
import {
  DEFAULT_READY_TIMEOUT_MS,
  demosRoot,
  GENERIC_URL_REGEX,
  type DemoConfig,
} from '../demos.config';

const ANSI = /\x1b\[[0-9;]*m/g;

/** 把绑定到任意地址的 host 归一化为 localhost，便于本机访问与拦截。 */
function normalizeHost(url: string): string {
  return url.replace(
    /:\/\/(?:0\.0\.0\.0|\[::1?\]|\[::\])(?=:)/,
    '://localhost'
  );
}

export interface BootedDemo {
  url: string;
  proc: ChildProcess;
  /** 输出快照，调试用 */
  output: () => string;
  close: () => Promise<void>;
}

function stripAnsi(s: string): string {
  return s.replace(ANSI, '');
}

async function reachable(url: string): Promise<boolean> {
  try {
    // 任何响应（含 4xx/5xx）都说明端口已起；dev server 起来前会 ECONNREFUSED
    await fetch(url, { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 启动一个 demo 的 dev server：
 * - 若 cfg.url 固定：轮询该 URL 直到可达
 * - 否则：解析 stdout/stderr 中的 dev server URL
 * 返回 { url, close }。close() 会 kill 整个进程树（next/nuxt/vue-cli 会派生子进程）。
 */
export async function bootDemo(cfg: DemoConfig): Promise<BootedDemo> {
  const cwd = path.join(demosRoot, cfg.dir);
  const cmd = cfg.cmd ?? 'pnpm';
  const args = cfg.args ?? ['run', 'dev'];
  const timeout = cfg.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS;
  const urlRegex = cfg.urlRegex ?? GENERIC_URL_REGEX;

  const proc = spawn(cmd, args, {
    cwd,
    env: { ...process.env, FORCE_COLOR: '0', BROWSER: 'none', ...cfg.env },
    shell: process.platform === 'win32',
  });

  let buffer = '';
  const output = () => buffer;
  const onData = (chunk: Buffer) => {
    buffer += stripAnsi(chunk.toString());
  };
  proc.stdout?.on('data', onData);
  proc.stderr?.on('data', onData);

  let exited = false;
  proc.on('exit', () => {
    exited = true;
  });

  // 等整个进程树真正退出后再返回，避免串行下个 demo 启动时端口/资源未释放。
  const close = async () => {
    proc.stdout?.off('data', onData);
    proc.stderr?.off('data', onData);
    if (exited || !proc.pid) return;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      proc.once('exit', finish);
      treeKill(proc.pid!, 'SIGTERM', () => {});
      // 4s 内未退出则强杀；6s 兜底返回
      setTimeout(() => {
        if (!done && proc.pid) treeKill(proc.pid, 'SIGKILL', () => {});
      }, 4000);
      setTimeout(finish, 6000);
    });
  };

  try {
    const url = await new Promise<string>((resolve, reject) => {
      const deadline = Date.now() + timeout;

      const tick = async () => {
        if (exited) {
          return reject(
            new Error(
              `[${cfg.dir}] dev 进程提前退出。输出:\n${buffer.slice(-2000)}`
            )
          );
        }
        // 固定 URL：轮询可达性
        if (cfg.url) {
          if (await reachable(cfg.url)) return resolve(cfg.url);
        } else {
          const m = buffer.match(urlRegex);
          if (m) {
            // 等端口真正能响应，避免解析到 URL 但服务尚未 ready
            const candidate = normalizeHost(m[1].replace(/\/$/, ''));
            if (await reachable(candidate)) return resolve(candidate);
          }
        }
        if (Date.now() > deadline) {
          return reject(
            new Error(
              `[${cfg.dir}] ${timeout}ms 内未就绪。输出:\n${buffer.slice(-2000)}`
            )
          );
        }
        setTimeout(tick, 500);
      };
      void tick();
    });

    return { url, proc, output, close };
  } catch (err) {
    await close();
    throw err;
  }
}
