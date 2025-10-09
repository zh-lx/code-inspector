# 模式切换功能使用指南

> 本 fork 添加了 **Shift+Alt+C** 模式切换功能，支持在 IDE 打开和复制路径之间切换。

## ✨ 功能说明

- **📝 IDE 模式**（默认）：点击元素在 IDE 中打开源代码
- **📋 复制模式**：点击元素复制文件路径到剪贴板（格式：`/path/to/file.tsx:42:10`）
- **⌨️ 切换快捷键**：`Shift+Alt+C`
- **💡 Toast 提示**：切换时显示当前模式
- **🎯 模式指示器**：浮窗底部显示当前模式和快捷键

---

## 🚀 使用方法

### 方法一：源码编译 + npm link

适合开发者或需要自定义修改的场景。

```bash
# 1. 克隆本仓库
git clone https://github.com/MarkShawn2020/code-inspector.git
cd code-inspector

# 2. 切换到功能分支
git checkout feat/mode-switching

# 3. 安装依赖并构建
pnpm install
pnpm build

# 4. 链接到你的项目
cd /path/to/your-project
npm link /path/to/code-inspector/packages/code-inspector-plugin
```

**优点**：
- ✅ 完全控制，可自定义修改
- ✅ 适合开发调试

**缺点**：
- ❌ 需要 Node.js 和 pnpm 环境
- ❌ 首次构建较慢

---

### 方法二：curl 直接替换（简化版）

如果你想用 curl 方式，需要我们先将编译文件提交到 Git。目前 `dist/` 文件未包含在 Git 中。

**可选操作**（由仓库维护者完成）：
```bash
# 在 code-inspector 仓库中
git add -f packages/core/dist/client.iife.js packages/core/dist/client.umd.js
git commit -m "chore: add compiled client files for easy patching"
git push
```

完成后，用户可以：
```bash
# 1. 正常安装原版包
npm install code-inspector-plugin

# 2. 下载并替换编译后的客户端文件
curl -L https://github.com/MarkShawn2020/code-inspector/raw/feat/mode-switching/packages/core/dist/client.iife.js \
  -o node_modules/@code-inspector/core/dist/client.iife.js

curl -L https://github.com/MarkShawn2020/code-inspector/raw/feat/mode-switching/packages/core/dist/client.umd.js \
  -o node_modules/@code-inspector/core/dist/client.umd.js

# 3. 重启开发服务器
npm run dev
```

**优点**：
- ✅ 无需编译环境
- ✅ 快速（只替换 2 个 51KB 文件）

**缺点**：
- ⚠️ 需要先提交 dist 文件到 Git
- ⚠️ `npm install` 会覆盖，需配合 postinstall 脚本

---

## 使用新功能

1. 启动开发服务器
2. 按住 `Shift+Alt` 激活代码检查器
3. 按 `Shift+Alt+C` 切换模式（会显示 Toast 提示）
4. 点击页面元素：
   - **IDE 模式**：在编辑器中打开源代码
   - **复制模式**：复制路径到剪贴板（格式：`/path/to/file.tsx:42:10`）

---

## 验证是否成功

检查浏览器控制台是否有：
```
[code-inspector-plugin] Press and hold ⌥option + shift to enable the feature...
```

按 `Shift+Alt` 悬停时，浮窗底部应显示：
```
Mode: 📝 IDE (Shift+Alt+C to toggle)
```

---

## 问题排查

### 功能未生效

```bash
# 检查文件是否正确替换
ls -lh node_modules/@code-inspector/core/dist/client.*.js

# 清除缓存并重启
rm -rf node_modules/.vite  # Vite 项目
rm -rf .next/cache         # Next.js 项目
npm run dev
```

### TypeScript 类型错误

如果遇到类型错误，更新类型定义：

```bash
curl -L https://github.com/MarkShawn2020/code-inspector/raw/feat/mode-switching/packages/core/types/client/index.d.ts \
  -o node_modules/@code-inspector/core/types/client/index.d.ts
```

---

## 相关链接

- **PR 地址**：https://github.com/zh-lx/code-inspector/pull/406
- **原仓库**：https://github.com/zh-lx/code-inspector
- **本 fork**：https://github.com/MarkShawn2020/code-inspector

---

## 致谢

本功能基于 [code-inspector](https://github.com/zh-lx/code-inspector) 开发，感谢原作者 [@zh-lx](https://github.com/zh-lx) 的优秀工作！

等待 PR 合并后，可通过正常的 `npm update` 升级使用。
