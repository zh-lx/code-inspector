import { test, expect } from '@playwright/test';
import { DEFAULT_READY_TIMEOUT_MS, demos } from '../demos.config';
import { bootDemo, type BootedDemo } from '../helpers/boot-demo';
import {
  collectInspPaths,
  parseInspPath,
  validateInspPath,
} from '../helpers/inspector';

// L1：对每个 demo 验证 ① dev server 成功启动并渲染 ② data-insp-path 正确注入。
for (const demo of demos) {
  test(`L1 smoke: ${demo.dir}`, async ({ page }) => {
    test.setTimeout((demo.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS) + 60_000);

    let booted: BootedDemo | undefined;
    try {
      booted = await bootDemo(demo);

      await page.goto(booted.url, { waitUntil: 'domcontentloaded' });

      // ① 页面成功渲染（body 内有元素）
      await expect
        .poll(() => page.locator('body *').count(), { timeout: 30_000 })
        .toBeGreaterThan(0);

      // 无 vite 错误遮罩
      expect(await page.locator('vite-error-overlay').count()).toBe(0);

      // ② 注入存在（SPA 需等应用挂载 + 客户端注入）
      let paths: string[] = [];
      await expect
        .poll(
          async () => {
            paths = await collectInspPaths(page);
            return paths.length;
          },
          { timeout: 30_000 },
        )
        .toBeGreaterThan(0);

      // ③ 取样校验注入值合法（路径绝对、在仓库内、文件存在、行列为正）
      const sample = paths.slice(0, 5);
      for (const raw of sample) {
        const parsed = parseInspPath(raw);
        expect(parsed, `无法解析 data-insp-path: ${raw}`).not.toBeNull();
        const errors = validateInspPath(parsed!);
        expect(errors, errors.join('; ')).toHaveLength(0);
      }
    } finally {
      await booted?.close();
    }
  });
}
