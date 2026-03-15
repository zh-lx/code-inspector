# AI Assistant  <Badge type="tip" text="2.0.0-beta.6+" vertical="middle" />

The AI Assistant lets you chat with AI directly in the browser and modify code with DOM-related source context.

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.gif)

## Quick Start

Enable AI via `behavior.ai`. Supported providers: `claudeCode`, `codex`, and `opencode`.

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: true,
    },
  },
}),
```

## Usage

:::tip Note
Methods 1 and 2 require AI Assistant to be enabled first. Press `hotKeys + Z` to check the current state. <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.png" width="240" />
:::

### Method 1: HotKeys + Left Click

Hold the combination key (`Option + Shift` on Mac, `Alt + Shift` on Windows). Move over a DOM node, then left-click to open AI Assistant with that DOM node's source context.

### Method 2: Switch + Left Click

When `showSwitch: true` and the switch is on, move over a DOM node and left-click to open AI Assistant with the node's source context.

### Method 3: HotKeys + Key `4`

While holding the combination key:
- If a DOM mask is active, pressing `4` opens AI Assistant with that DOM context.
- If no DOM mask is active, pressing `4` opens project-level AI Assistant.

This method works even when the AI switch is off.

## Codex Configuration

- `type: 'cli'`: use local Codex CLI (default), best when your local Codex setup is ready.
- `type: 'sdk'`: use Codex SDK, best when you need explicit `apiKey/baseUrl` control.

### Use Codex CLI

Minimal setup:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: true,
    },
  },
}),
```

Custom CLI options:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        type: 'cli',
        options: {
          model: 'gpt-5-codex',
          models: ['gpt-5-codex', 'gpt-5.1-codex'],
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

### Use Codex SDK

Install:

```bash
npm i @openai/codex-sdk
```

Configure:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        type: 'sdk',
        options: {
          model: 'gpt-5-codex',
          models: ['gpt-5-codex', 'gpt-5.1-codex'],
          approvalPolicy: 'on-request',
          sandboxMode: 'workspace-write',
          cwd: process.cwd(),
        },
      },
    },
  },
}),
```

#### Codex SDK `.env` Setup (API Key / Base URL)

Recommended `.env.local` values:

```shell
# .env.local
OPENAI_API_KEY=sk-xxxxx
OPENAI_BASE_URL=https://your-openai-gateway.example.com/v1
```

Then pass them explicitly in `options`:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        type: 'sdk',
        options: {
          apiKey: process.env.OPENAI_API_KEY,
          baseUrl: process.env.OPENAI_BASE_URL,
          model: 'gpt-5-codex',
          models: ['gpt-5-codex', 'gpt-5.1-codex'],
        },
      },
    },
  },
}),
```

::: details Full Codex Type Definitions

```ts
type CodexOptions =
  | {
      type?: 'cli';
      options?: CodexCliOptions;
    }
  | {
      type: 'sdk';
      options?: CodexSdkOptions;
    };

type CodexCliOptions = {
  model?: string;
  models?: string[];
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
  models?: string[];
  profile?: string;
  config?: Record<string, string | number | boolean>;
  env?: Record<string, string | undefined>;
  skipGitRepoCheck?: boolean;
  codexPathOverride?: string;
  baseUrl?: string;
  apiKey?: string;
  sandboxMode?:
    | 'read-only'
    | 'workspace-write'
    | 'danger-full-access'
    | {
        type: 'workspace-write';
        writableRoots: string[];
        networkAccess?: boolean;
        excludeTmpdirEnvVar?: boolean;
      }
    | {
        type: 'danger-full-access';
        networkAccess?: boolean;
        excludeTmpdirEnvVar?: boolean;
      };
  cwd?: string;
  modelReasoningEffort?: 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  webSearchRequest?: {
    searchContextSize?: 'low' | 'medium' | 'high';
    userLocation?: {
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
    };
  };
  enableWebSearch?: boolean;
  approvalPolicy?: 'on-request' | 'on-failure' | 'never' | 'untrusted';
  additionalWritableRoots?: string[];
};
```

:::

## OpenCode Configuration

- `type: 'cli'`: use local OpenCode CLI (default).
- `type: 'sdk'`: use OpenCode SDK.

### Use OpenCode CLI

Minimal setup:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      opencode: true,
    },
  },
}),
```

Custom CLI options (same shape as Codex CLI options):

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      opencode: {
        type: 'cli',
        options: {
          model: 'open-code-model',
          models: ['open-code-model', 'open-code-model-next'],
          sandbox: 'workspace-write',
          fullAuto: true,
        },
      },
    },
  },
}),
```

### Use OpenCode SDK

Install:

```bash
npm i @opencode-ai/sdk
```

Configure:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      opencode: {
        type: 'sdk',
        options: {
          model: 'open-code-model',
          models: ['open-code-model', 'open-code-model-next'],
          approvalPolicy: 'on-request',
          sandboxMode: 'workspace-write',
          cwd: process.cwd(),
        },
      },
    },
  },
}),
```

## Claude Code Configuration

### Choose A Mode First

- `type: 'cli'`: use local Claude Code CLI (default), best when your local Claude Code setup is ready.
- `type: 'sdk'`: use Claude Agent SDK, best when you need explicit `apiKey/baseUrl` control.

### Use Claude Code CLI

If Claude Code is installed locally, the plugin will call local CLI via a Node subprocess.

Minimal setup:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: true,
    },
  },
}),
```

Custom CLI options:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        type: 'cli',
        options: {
          model: 'claude-sonnet-4.5',
          models: ['claude-sonnet-4.5', 'claude-opus-4.1'],
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

See [Claude Code Overview](https://code.claude.com/docs/overview) for installation and setup.

### Use Claude Agent SDK

Install:

```bash
npm i @anthropic-ai/claude-agent-sdk
```

Configure:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        type: 'sdk',
        options: {
          model: 'claude-sonnet-4.5',
          models: ['claude-sonnet-4.5', 'claude-opus-4.1'],
          maxTurns: 20,
          permissionMode: 'bypassPermissions',
        },
      },
    },
  },
}),
```

#### Claude SDK `.env` Setup (API Key / Base URL)

Set `.env.local`:

```shell
# .env.local
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_BASE_URL=https://your-claude-gateway.example.com
```

You can also pass them explicitly:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        type: 'sdk',
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

::: details Full Claude Code Type Definitions

```ts
type ClaudeCodeOptions =
  | {
      type?: 'cli';
      options?: ClaudeCliOptions;
    }
  | {
      type: 'sdk';
      options?: ClaudeSdkOptions;
    };

type ClaudeCliOptions = {
  allowedTools?: string[];
  disallowedTools?: string[];
  model?: string;
  models?: string[];
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
  models?: string[];
  maxTurns?: number;
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions';
  systemPrompt?: string | { type: 'preset'; preset: 'claude_code'; append?: string };
  env?: Record<string, string | undefined>;
  mcpServers?: Record<string, any>;
  maxThinkingTokens?: number;
  maxBudgetUsd?: number;
  allowDangerouslySkipPermissions?: boolean;
  settingSources?: Array<'user' | 'project' | 'local'>;
  extraArgs?: Record<string, string | null>;
};
```

:::

For more Claude SDK details, see [Claude Code Agent SDK](https://platform.claude.com/docs/agent-sdk/typescript).

## Conversation History

The AI Assistant automatically saves each Q&A to the `node_modules/.code-inspector/` directory in your project. Click the clock icon in the top-right corner of the chat dialog to browse history. Select an entry to restore its conversation context.

### expireDays

- Optional
- Type: `number`, default `0`
- Description: Number of days before conversation history expires. Defaults to `0` (no auto-cleanup). When set to a positive integer, opening the history list will automatically clean up records older than the specified number of days.

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: true,
      expireDays: 30, // auto-cleanup history older than 30 days
    },
  },
}),
```
