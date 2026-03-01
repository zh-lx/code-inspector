# AI 助手

AI 助手可以在浏览器中直接与 AI 对话，根据你描述的需求帮你修改代码。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.gif)

## 配置

通过 `behavior.ai` 来开启 AI 助手功能，目前支持 `claudeCode`：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: true,
    },
  },
}),
```


## 使用方式

:::tip 注意事项
方式 1 和 方式 2 需要确保 AI Assitant 功能是开启状态，按 `插件组合键 + Z` 可以查看功能是否开启。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.png" width="240" /> 
:::

### 方式1: 组合键 + 单击鼠标左键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会打开 AI Assitant 并将该 DOM 的源码位置信息添加至 AI 上下文中。

### 方式2: 功能开关 + 单击鼠标左键

当插件参数中配置了 `showSwitch: true` 且开关的颜色为打开状态(彩色) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" /> 时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时单击鼠标左键会打开 AI Assitant 并将该 DOM 的源码位置信息添加至 AI 上下文中。

### 方式3: 组合键 + 4键

在页面上按住组合键 (Mac 系统默认为 `Option + Shift`；Window 的默认为是 `Alt + Shift`) 时：
- 如果鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，此时再按 `数字4` 键，就可以快捷打开 AI Assitant 并将该 DOM 的源码位置信息添加至 AI 上下文中。
- 如果此时不移动鼠标显示 DOM 遮罩层，直接按 `数字4` 键，可以快捷打开项目级别的 AI Assitant。

<b>此方式设置中无论 AI Assitant 功能是否开启，都可以快捷触发 AI Assitant 功能。</b>

## Claude Code 配置

### 使用 Claude Code

如果你本地安装了 Claude Code，`code-inspector-plugin` 会优先通过 Nodejs 子进程调用本地的 Claude Code 进行 AI Assitant。这种方式可以完全继承你本地的 Claude Code 配置，你无需再次手动配置任何的其他参数，并且这种方式可以有更好的上下文连续性，因此是最为推荐的方式。

你可以参考 [Claude Code Overview](https://code.claude.com/docs/zh-CN/overview) 来安装及配置 Claude Code。

### 使用 Claude Agent SDK

如果你不想使用本地的 Claude Code，你也可以使用 claude agent sdk，通过如下命令在项目安装 claude agent sdk:

```shell
npm i @anthropic-ai/claude-agent-sdk
```

然后你需要在 `behaivor.ai.claudeCode` 中指定 `agent: 'sdk'` 来使用 sdk：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        // 指定 Agent 类型：'cli'（默认）使用本地 Claude Code CLI，'sdk' 使用 Claude Agent SDK
        agent: 'sdk',
        // SDK 选项（agent 为 'sdk' 时使用）
        sdkOptions: {
          model: 'claude-sonnet-4.5',
          maxTurns: 20,
          permissionMode: 'bypassPermissions',
          // ...other options
        },
      },
    }
  },
}),
```

使用此方式，你需要在 `.env.local` 中指定 `ANTHROPIC_API_KEY`(必填) 和 `ANTHROPIC_BASE_URL`(可选) 等信息。

```shell
# .env.local
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_BASE_URL=https://xxxx.com
```

更多关于 sdkOptions 的参数配置，你可以参考 [claude code agent-sdk](https://platform.claude.com/docs/zh-CN/agent-sdk/typescript)