import { defineConfig } from '@playwright/test';

// 不使用全局 webServer：21 个 demo 的启动命令/端口各异，改由每个测试用 boot-demo 自行
// spawn dev 进程并解析 URL。测试串行执行（workers:1）避免端口冲突与资源争抢。
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // 单用例含 dev server 冷启动（最慢的 next/nuxt/vue-cli 可达 ~2min）+ 页面加载 + 断言
  timeout: 240_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    headless: true,
    // demo 与 code-inspector server(:5678) 跨源，且 dev server 证书/主机不固定
    ignoreHTTPSErrors: true,
    actionTimeout: 15_000,
  },
});
