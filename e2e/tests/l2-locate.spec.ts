import { test, expect } from '@playwright/test';
import { demos, PATH_NAME } from '../demos.config';
import { bootDemo, type BootedDemo } from '../helpers/boot-demo';
import { parseInspPath } from '../helpers/inspector';
import { MockInspectorServer } from '../helpers/mock-server';

// L2：端到端验证「代码定位」交互链路。
// 模拟默认热键 Shift+Alt 悬停 + 点击，拦截发往 code-inspector server 的定位请求，
// 断言其 file/line/column 与目标元素注入的 data-insp-path 一致。

// 为每个 demo 分配不同的端口，避免冲突（从 5700 开始，避开可能被占用的 5678）
demos.forEach((demo, index) => {
  demo.inspectorPort = 5700 + index;
});

for (const demo of demos) {
  test(`L2 locate: ${demo.dir}`, async ({ page }) => {
    test.setTimeout((demo.readyTimeoutMs ?? 60_000) + 60_000);

    let booted: BootedDemo | undefined;
    let mockServer: MockInspectorServer | undefined;

    try {
      const inspectorPort = demo.inspectorPort!;

      // 启动 mock inspector 服务器
      mockServer = new MockInspectorServer(inspectorPort);
      await mockServer.start();

      booted = await bootDemo(demo);

      await page.goto(booted.url, { waitUntil: 'domcontentloaded' });

      // 等 inspector 客户端就绪
      await page.waitForSelector('code-inspector-component', {
        state: 'attached',
        timeout: 30_000,
      });

      // 找一个「自身带注入数据、且无后代带注入数据」的可见叶子元素并打标记，
      // 保证点击命中的就是它本身（inspector 会优先选中更具体的子元素）。
      const expectedRaw = await page.evaluate((attr) => {
        const has = (el: Element) =>
          !!(
            el.getAttribute(attr) ||
            (el as unknown as Record<string, unknown>)[attr]
          );
        const els = Array.from(document.querySelectorAll('*'));
        for (const el of els) {
          if (!has(el)) continue;
          const hasInspChild = Array.from(el.querySelectorAll('*')).some(has);
          if (hasInspChild) continue;
          const r = el.getBoundingClientRect();
          if (r.width > 4 && r.height > 4) {
            el.setAttribute('data-e2e-target', '1');
            return (
              el.getAttribute(attr) ||
              ((el as unknown as Record<string, string>)[attr] as string)
            );
          }
        }
        return null;
      }, PATH_NAME);

      expect(expectedRaw, '未找到可点击的注入叶子元素').not.toBeNull();
      const expected = parseInspPath(expectedRaw!);
      expect(expected, `无法解析: ${expectedRaw}`).not.toBeNull();

      const target = page.locator('[data-e2e-target="1"]');
      await target.scrollIntoViewIfNeeded();

      // 注入端口信息到页面，让 code-inspector 使用我们的 mock 端口
      await page.evaluate((port) => {
        const component = document.querySelector('code-inspector-component') as any;
        if (component) {
          component.port = port;
        }
      }, inspectorPort);

      // 先按住 Shift+Alt 悬停，触发带修饰键的 mousemove 让 inspector 锁定该元素，
      // 再点击触发 locate（避免 click 早于 inspector 设置当前元素的竞态）。
      await target.hover({ modifiers: ['Alt', 'Shift'], force: true });
      await page.waitForTimeout(500);
      await target.click({ modifiers: ['Alt', 'Shift'], force: true });

      // 轮询检查 mock 服务器是否收到请求
      await expect
        .poll(() => mockServer!.getCaptured(), { timeout: 10_000 })
        .not.toBeNull();

      const captured = mockServer.getCaptured()!;
      expect(decodeURIComponent(captured.file || '')).toBe(expected!.path);
      expect(captured.line).toBe(expected!.line);
      expect(captured.column).toBe(expected!.column);
    } finally {
      await mockServer?.close();
      await booted?.close();
    }
  });
}
