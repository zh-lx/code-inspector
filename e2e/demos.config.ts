import path from 'node:path';

export const repoRoot = path.resolve(__dirname, '..');
export const demosRoot = path.join(repoRoot, 'demos');

// code-inspector 定位请求默认端口（packages/core/src/shared/constant.ts -> DefaultPort）
export const INSPECTOR_PORT = 5678;
// 注入属性名（packages/core/src/shared/constant.ts -> PathName）
export const PATH_NAME = 'data-insp-path';

// 通用 dev-server URL 解析：匹配 stdout 中第一个 http(s)://<本机host>:<port>
// 覆盖 localhost / 127.0.0.1 / 0.0.0.0 / [::1] / [::]（部分工具只打印后几种）
export const GENERIC_URL_REGEX =
  /(https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]):\d+[^\s]*)/i;

export interface DemoConfig {
  /** demos/ 下的目录名 */
  dir: string;
  /** 启动命令，默认 'pnpm' */
  cmd?: string;
  /** 启动参数，默认 ['run', 'dev'] */
  args?: string[];
  /** 额外环境变量 */
  env?: Record<string, string>;
  /** 等待 dev server 就绪的超时（ms），默认 60000 */
  readyTimeoutMs?: number;
  /** 自定义 URL 解析正则（默认 GENERIC_URL_REGEX） */
  urlRegex?: RegExp;
  /** 固定 URL（跳过 stdout 解析，用于不打印干净 URL 的工具） */
  url?: string;
  /** L2 测试使用的 inspector 端口（默认从 5700 开始自动分配） */
  inspectorPort?: number;
}

const HEAVY = 120_000;

export const demos: DemoConfig[] = [
  // ---- vite 系（默认 `vite`，通用解析）----
  { dir: 'vite-vue3' },
  { dir: 'vite-react' },
  { dir: 'vite-vue2' },
  { dir: 'vite-preact' },
  { dir: 'vite-qwik' },
  { dir: 'vite-solid' },
  { dir: 'vite-svelte' },

  // ---- astro（astro dev，port 4321）----
  { dir: 'astro-v6', readyTimeoutMs: HEAVY },
  { dir: 'vite-astro', readyTimeoutMs: HEAVY },

  // ---- next 系（冷启动慢）----
  { dir: 'nextjs', readyTimeoutMs: HEAVY },
  { dir: 'next15', readyTimeoutMs: HEAVY },
  { dir: 'turbopack-next', readyTimeoutMs: HEAVY },

  // ---- nuxt ----
  { dir: 'nuxt', readyTimeoutMs: HEAVY },

  // ---- umi/mako ----
  { dir: 'mako', readyTimeoutMs: HEAVY },

  // ---- farm ----
  { dir: 'farm-vue3', readyTimeoutMs: HEAVY },

  // ---- rsbuild（去掉 --open 防止拉起浏览器）----
  { dir: 'rsbuild-vue3', cmd: 'pnpm', args: ['exec', 'rsbuild', 'dev'], readyTimeoutMs: HEAVY },

  // ---- rspack ----
  { dir: 'rspack-vue3', readyTimeoutMs: HEAVY },

  // ---- esbuild（自带 serve，指定端口并固定 URL）----
  {
    dir: 'esbuild-react',
    cmd: 'node',
    args: ['esbuild.config.mjs', '--start', '--port', '8000'],
    url: 'http://localhost:8000',
    readyTimeoutMs: HEAVY,
  },

  // ---- webpack：CRA（scripts/start.js，禁用自动开浏览器并指定端口）----
  {
    dir: 'webpack-react',
    cmd: 'pnpm',
    args: ['run', 'start'],
    env: { BROWSER: 'none', PORT: '3001' },
    readyTimeoutMs: HEAVY,
  },

  // ---- webpack：vue-cli（serve 脚本；webpack4 + OpenSSL3 需 legacy provider）----
  {
    dir: 'webpack-vue-tsx',
    args: ['run', 'serve'],
    env: { NODE_OPTIONS: '--openssl-legacy-provider' },
    readyTimeoutMs: HEAVY,
  },
  {
    dir: 'webpack5-vue3',
    args: ['run', 'serve'],
    env: { NODE_OPTIONS: '--openssl-legacy-provider' },
    readyTimeoutMs: HEAVY,
  },
];

// 移除 getDeepDemos 函数，所有 demo 默认都进行 L2 测试
