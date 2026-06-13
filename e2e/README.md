# Demo E2E 测试

对 `demos/` 下全部 demo 做自动化验证：① dev server 能启动并渲染页面；② 代码定位功能正常。

## 前置

```bash
pnpm install
pnpm build                      # 产出 packages/*/dist（demo 依赖 workspace 插件）
npx playwright install chromium # 安装浏览器
```

## 运行

```bash
pnpm test:e2e        # 全部（L1 + L2）
pnpm test:e2e:l1     # 仅 L1：全部 demo 启动 + data-insp-path 注入校验
pnpm test:e2e:l2     # 仅 L2：代表性 demo 端到端定位（Shift+Alt+click 拦截 :5678 请求）
```

单跑某个 demo：

```bash
pnpm test:e2e:l1 -- -g vite-vue3
```

`pretest:e2e` 会自动先 `pnpm build`，确保插件 dist 最新。

## 结构

- `demos.config.ts` —— 21 个 demo 的启动配置表（命令 / 端口解析 / 超时 / 是否做 L2）
- `helpers/boot-demo.ts` —— spawn dev 进程、解析就绪 URL、测后 kill 进程树
- `helpers/inspector.ts` —— 收集与解析 `data-insp-path`、校验源码定位合法性
- `tests/l1-smoke.spec.ts` —— L1，遍历全部 demo
- `tests/l2-locate.spec.ts` —— L2，`deep: true` 的 demo

## 新增 demo 怎么办

在 `demos.config.ts` 的 `demos` 数组里加一项即可。多数情况只需 `{ dir: '<目录名>' }`（默认 `pnpm run dev` + 通用 URL 解析）。冷启动慢的设 `readyTimeoutMs`；命令/端口特殊的用 `cmd`/`args`/`url` 覆盖；需要端到端定位的加 `deep: true`。
