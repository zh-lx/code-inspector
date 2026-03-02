# AI Assistant  <Badge type="tip" text="2.0.0-beta.6+" vertical="middle" />

The AI Assistant lets you chat with AI directly in the browser and modify code with DOM-related source context.

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.gif)

## Quick Start

Enable AI via `behavior.ai`. Supported providers: `claudeCode` and `codex`.

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

- `agent: 'cli'`: use local Codex CLI (default), best when your local Codex setup is ready.
- `agent: 'sdk'`: use Codex SDK, best when you need explicit `apiKey/baseUrl` control.

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
        agent: 'sdk',
        options: {
          model: 'gpt-5-codex',
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

::: details Full Codex Type Definitions

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

## Claude Code Configuration

### Choose A Mode First

- `agent: 'cli'`: use local Claude Code CLI (default), best when your local Claude Code setup is ready.
- `agent: 'sdk'`: use Claude Agent SDK, best when you need explicit `apiKey/baseUrl` control.

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

::: details Full Claude Code Type Definitions

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
  allowDangerouslySkipPermissions?: boolean;
  settingSources?: Array<'user' | 'project' | 'local'>;
  extraArgs?: Record<string, string | null>;
};
```

:::

For more Claude SDK details, see [Claude Code Agent SDK](https://platform.claude.com/docs/agent-sdk/typescript).
