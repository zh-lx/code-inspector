# AI Assistant

The AI assistant allows you to chat with AI directly in the browser to modify code based on your described requirements.

![code-inspector](https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.gif)

## Configuration

Enable the AI assistant via `behavior.ai`. Currently supports `claudeCode` and `codex`:

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
Methods 1 and 2 require the AI Assistant feature to be enabled. Press `hotKeys + Z` to check if it is enabled. <img src="https://cdn.jsdelivr.net/gh/zh-lx/static-img/code-inspector/ai.png" width="240" />
:::

### Method 1: HotKeys + Left Click

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows), move the mouse over the page and a mask layer will appear on DOM elements. Left click to open the AI Assistant with the DOM's source code location added to the AI context.

### Method 2: Switch + Left Click

When `showSwitch: true` is configured and the switch is in the on state (colored) <img src="https://github.com/zh-lx/code-inspector/assets/73059627/842c3e88-dca7-4743-854c-d61093d3d34f" width="20" style="display: inline-block; transform: translateY(5px);" />, move the mouse over the page and a mask layer will appear on DOM elements. Left click to open the AI Assistant with the DOM's source code location added to the AI context.

### Method 3: HotKeys + Key 4

Hold the combination key on the page (default is `Option + Shift` on Mac; `Alt + Shift` on Windows):
- If you move the mouse to show the DOM mask layer, press the `4` key to quickly open the AI Assistant with the DOM's source code location added to the AI context.
- If you press the `4` key directly without moving the mouse to show the DOM mask layer, it opens a project-level AI Assistant.

<b>This method works regardless of whether the AI Assistant feature is enabled.</b>

## Codex Configuration

### Using Codex CLI

The `codex` provider only supports local `Codex CLI` and does not support SDK mode.

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: true,
    },
  },
}),
```

You can also pass custom Codex CLI options:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      codex: {
        model: 'gpt-5.3-codex',
        profile: 'default',
        sandbox: 'workspace-write',
        fullAuto: true,
        // Pass through as -c key=value
        config: {
          'reasoning.effort': 'high',
        },
      },
    },
  },
}),
```

## Claude Code Configuration

### Using Claude Code

If you have Claude Code installed locally, `code-inspector-plugin` will call the local Claude Code via a Node.js subprocess for the AI Assistant. This approach fully inherits your local Claude Code configuration, requiring no additional manual setup, and provides better context continuity. This is the most recommended approach.

You can refer to [Claude Code Overview](https://code.claude.com/docs/overview) to install and configure Claude Code.

### Using Claude Agent SDK

If you don't want to use local Claude Code, you can use the Claude Agent SDK. Install it in your project with:

```shell
npm i @anthropic-ai/claude-agent-sdk
```

Then specify `agent: 'sdk'` in `behavior.ai.claudeCode` to use the SDK:

```js
codeInspectorPlugin({
  behavior: {
    ai: {
      claudeCode: {
        // Agent type: 'cli' (default) uses local Claude Code CLI, 'sdk' uses Claude Agent SDK
        agent: 'sdk',
        // SDK options (used when agent is 'sdk')
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

When using this approach, you need to specify `ANTHROPIC_API_KEY` (required) and `ANTHROPIC_BASE_URL` (optional) in `.env.local`:

```shell
# .env.local
ANTHROPIC_API_KEY=sk-xxxxx
ANTHROPIC_BASE_URL=https://xxxx.com
```

For more about sdkOptions configuration, refer to [Claude Code Agent SDK](https://platform.claude.com/docs/agent-sdk/typescript)
