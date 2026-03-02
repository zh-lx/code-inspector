# AI 助手

AI 助手可以在浏览器中直接与 AI 对话，并结合当前 DOM 对应的源码上下文来修改代码。

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.gif)

## 快速开启

通过 `behavior.ai` 开启 AI 功能，支持 `claudeCode` 和 `codex`：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: true,
    },
  },
}),
```

## 使用方式

:::tip 注意
方式 1 和方式 2 需要先确保 AI Assistant 功能已开启。按 `插件组合键 + Z` 可查看状态。<img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.png" width="240" />
:::

### 方式 1：组合键 + 鼠标左键

按住组合键（Mac 默认 `Option + Shift`，Windows 默认 `Alt + Shift`），鼠标移动到页面元素后会出现遮罩层，左键点击即可打开 AI Assistant，并带上该 DOM 的源码上下文。

### 方式 2：功能开关 + 鼠标左键

当 `showSwitch: true` 且开关处于开启状态时，鼠标移动到页面元素后会出现遮罩层，左键点击即可打开 AI Assistant，并带上该 DOM 的源码上下文。

### 方式 3：组合键 + 数字 4

按住组合键时：
- 如果当前有 DOM 遮罩层，按 `4` 会打开带当前 DOM 上下文的 AI Assistant。
- 如果当前没有 DOM 遮罩层，按 `4` 会打开项目级 AI Assistant。

此方式不受 AI Assistant 开关状态影响，可直接触发。

## Codex 配置

- `agent: 'cli'`：使用本地 Codex CLI（默认），更适合已在本机配置好 Codex 的场景。
- `agent: 'sdk'`：使用 Codex SDK，适合需要显式控制 `apiKey/baseUrl`、或接入网关服务的场景。

### 使用 Codex CLI

最小配置：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: true,
    },
  },
}),
```

自定义 CLI 参数：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        agent: 'cli',
        options: {
          model: 'gpt-5-codex',
          profile: 'default',
          sandbox: 'workspace-write',
          fullAuto: true,
          config: {
            'reasoning.effort': 'high',
          },
        },
      },
    },
  },
}),
```

### 使用 Codex SDK

安装：

```bash
npm i @openai/codex
```

配置：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        agent: 'sdk',
        options: {
          model: 'gpt-5-codex',
          approvalPolicy: 'full-auto',
          sandboxMode: 'workspace-write',
        },
      },
    },
  },
}),
```

#### Codex SDK 的 `.env`（API Key / Base URL）

推荐在 `.env.local` 中配置：

```shell
# .env.local
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://your-openai-gateway.example.com/v1
```

然后在配置中显式传入：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        agent: 'sdk',
        options: {
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: process.env.OPENAI_BASE_URL,
          model: 'gpt-5-codex',
        },
      },
    },
  },
}),
```

::: details Codex 完整类型定义

```ts
type CodexOptions =
  | {
      agent?: 'cli';
      options?: CodexCliOptions;
    }
  | {
      agent: 'sdk';
      options?: CodexSdkOptions;
    };

type CodexCliOptions = {
  model?: string;
  profile?: string;
  sandbox?: 'read-only' | 'workspace-write' | 'danger-full-access';
  fullAuto?: boolean;
  skipGitRepoCheck?: boolean;
  ephemeral?: boolean;
  config?: Record<string, string | number | boolean>;
  env?: Record<string, string | undefined>;
};

type CodexSdkOptions = {
  model?: string;
  config?: Record<string, string | number | boolean>;
  env?: Record<string, string | undefined>;
  skipGitRepoCheck?: boolean;
  codexPathOverride?: string;
  baseUrl?: string;
  apiKey?: string;
  sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
  workingDirectory?: string;
  modelReasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  networkAccessEnabled?: boolean;
  webSearchMode?: 'auto' | 'off';
  webSearchEnabled?: boolean;
  approvalPolicy?: 'auto-edit' | 'full-auto' | 'on-failure' | 'on-request' | 'untrusted';
  additionalDirectories?: string[];
};
```

:::

## Claude Code 配置

### 先选模式

- `agent: 'cli'`：使用本地 Claude Code CLI（默认），更适合已在本机配置好 Claude Code 的场景。
- `agent: 'sdk'`：使用 Claude Agent SDK，适合需要显式控制 `apiKey/baseUrl`、或接入网关服务的场景。

### 使用 Claude Code CLI

如果你本地已安装 Claude Code，插件会优先通过 Node 子进程调用本地 CLI。

最小配置：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: true,
    },
  },
}),
```

自定义 CLI 参数：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        agent: 'cli',
        options: {
          model: 'claude-sonnet-4.5',
          maxTurns: 20,
          permissionMode: 'bypassPermissions',
          allowedTools: ['Read', 'Write', 'Edit', 'Bash'],
          disallowedTools: ['WebSearch'],
          maxCost: 2,
          systemPrompt: 'You are an expert code assistant.',
        },
      },
    },
  },
}),
```

可参考 [Claude Code Overview](https://code.claude.com/docs/zh-CN/overview) 安装与配置 Claude Code。

### 使用 Claude Agent SDK

安装：

```bash
npm i @anthropic-ai/claude-agent-sdk
```

配置：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        agent: 'sdk',
        options: {
          model: 'claude-sonnet-4.5',
          maxTurns: 20,
          permissionMode: 'bypassPermissions',
        },
      },
    },
  },
}),
```

#### Claude SDK 的 `.env`（API Key / Base URL）

在 `.env.local` 中配置：

```shell
# .env.local
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_BASE_URL=https://your-claude-gateway.example.com
```

也可以显式传入：

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        agent: 'sdk',
        options: {
          env: {
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
          },
        },
      },
    },
  },
}),
```

::: details Claude Code 完整类型定义

```ts
type ClaudeCodeOptions =
  | {
      agent?: 'cli';
      options?: ClaudeCliOptions;
    }
  | {
      agent: 'sdk';
      options?: ClaudeSdkOptions;
    };

type ClaudeCliOptions = {
  allowedTools?: string[];
  disallowedTools?: string[];
  model?: string;
  maxTurns?: number;
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions';
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code'; append?: string };
  env?: Record<string, string | undefined>;
  mcpServers?: Record<string, any>;
  maxCost?: number;
};

type ClaudeSdkOptions = {
  allowedTools?: string[];
  disallowedTools?: string[];
  model?: string;
  maxTurns?: number;
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions';
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code'; append?: string };
  env?: Record<string, string | undefined>;
  mcpServers?: Record<string, any>;
  maxThinkingTokens?: number;
  maxBudgetUsd?: number;
};
```

:::

更多 Claude SDK 参数说明可参考 [Claude Code Agent SDK](https://platform.claude.com/docs/zh-CN/agent-sdk/typescript)。
