import fs from 'fs';
import path from 'path';
import type { OpenCodeOptions } from '../shared';
import type { AIContext, AIMessage } from './ai';
import type { ProviderCallbacks, ProviderResult } from './ai-provider-claude';
import {
  handleCodexRequest,
  getModelInfo as getCodexModelInfo,
  type CodexProviderRuntime,
} from './ai-provider-common';

const OPENCODE_DEFAULT_MODEL = 'opencode/big-pickle';

const OPENCODE_PROVIDER_RUNTIME: CodexProviderRuntime = {
  providerId: 'opencode',
  displayName: 'OpenCode',
  cliBinaryName: 'opencode',
  sdkPackages: ['@opencode-ai/sdk'],
  sdkInstallCommand: 'npm install @opencode-ai/sdk',
};

const INLINE_IMAGE_DATA_URL_REGEX =
  /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;

type OpenCodeSdkModule = {
  createOpencode?: (options?: Record<string, any>) => Promise<{
    client: any;
    server: { close: () => void };
  }>;
};

type InlineImagePayload = {
  mediaType: string;
  data: string;
};

function resolveModelValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function getOpenCodeAgentOptions(
  openCodeOptions?: OpenCodeOptions,
): Record<string, any> {
  return (openCodeOptions?.options || {}) as Record<string, any>;
}

function withOpenCodeDefaultModel(
  openCodeOptions: OpenCodeOptions | undefined,
): OpenCodeOptions {
  const normalizedOptions = (openCodeOptions || {}) as OpenCodeOptions & {
    options?: Record<string, any>;
  };
  const agentOptions = normalizedOptions.options || {};
  const model =
    resolveModelValue(agentOptions.model) ||
    resolveModelValue(agentOptions?.config?.model);

  if (model) {
    return normalizedOptions;
  }

  return {
    ...normalizedOptions,
    options: {
      ...agentOptions,
      model: OPENCODE_DEFAULT_MODEL,
    },
  } as OpenCodeOptions;
}

function stripInlineImageDataUrls(text: string): string {
  return text.replace(
    INLINE_IMAGE_DATA_URL_REGEX,
    '[Inline image data omitted]',
  );
}

function extractInlineImages(text: string): {
  text: string;
  images: InlineImagePayload[];
} {
  const images: InlineImagePayload[] = [];
  let imageIndex = 0;
  const rewritten = text.replace(
    INLINE_IMAGE_DATA_URL_REGEX,
    (_match, mediaType: string, data: string) => {
      imageIndex += 1;
      images.push({ mediaType, data });
      return `[Inline image ${imageIndex} attached separately (${mediaType})]`;
    },
  );

  return { text: rewritten, images };
}

function buildPrompt(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  projectRootPath: string,
): string {
  const parts: string[] = [];

  if (projectRootPath) {
    parts.push(`[Project] Working in project: ${projectRootPath}`);
  }

  if (context) {
    const absolutePath = path.resolve(projectRootPath, context.file);
    let fileRef = context.file;
    if (fs.existsSync(absolutePath)) {
      fileRef = `@${context.file}#${context.line}`;
    }
    parts.push(
      `[Context] I'm looking at a <${context.name}> component located at ${fileRef}.`,
    );
  }

  if (history.length > 0) {
    const historyLines = history.map((msg) =>
      msg.role === 'user' ? `[Q] ${msg.content}` : `[A] ${msg.content}`,
    );
    parts.push(`[Previous conversation]\n${historyLines.join('\n')}`);
  }

  parts.push(`[Current question] ${message}`);

  return parts.join('\n\n');
}

function buildResumeTurnPrompt(
  message: string,
  context: AIContext | null,
  projectRootPath: string,
): string {
  const scopeNote = context
    ? '[Note] Context above applies to this turn only. Prior turn context may be outdated.'
    : '[Note] This turn is in Global mode with no selected DOM element. Ignore any element-specific context from prior turns.';
  return (
    buildPrompt(message, context, [], projectRootPath) + `\n\n${scopeNote}`
  );
}

const EDIT_TOOL_NAMES = new Set(['edit', 'write', 'str_replace_editor']);

function getEditFilePath(input: Record<string, any> | undefined): string {
  if (!input) return '';
  for (const key of ['file_path', 'path', 'file']) {
    if (typeof input[key] === 'string' && input[key]) return input[key];
  }
  return '';
}

function readFileContent(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function mediaTypeToExtension(mediaType: string): string {
  const rawSubtype = mediaType.split('/')[1] || '';
  const subtype = rawSubtype.split('+')[0].toLowerCase();
  if (subtype === 'jpeg') return 'jpg';
  if (subtype === 'svg+xml') return 'svg';
  if (subtype === 'x-icon') return 'ico';
  return subtype || 'png';
}

function parseOpenCodeModelRef(
  model?: string,
): { providerID: string; modelID: string } | undefined {
  const normalized = resolveModelValue(model);
  if (!normalized) return undefined;
  const slashIndex = normalized.indexOf('/');
  if (slashIndex <= 0 || slashIndex >= normalized.length - 1) {
    return undefined;
  }
  return {
    providerID: normalized.slice(0, slashIndex),
    modelID: normalized.slice(slashIndex + 1),
  };
}

function buildOpenCodePromptParts(
  promptText: string,
  images: InlineImagePayload[],
): Array<Record<string, any>> {
  return [
    {
      type: 'text',
      text: promptText,
    },
    ...images.map((image, index) => ({
      type: 'file',
      mime: image.mediaType,
      filename: `inline-image-${index + 1}.${mediaTypeToExtension(image.mediaType)}`,
      url: `data:${image.mediaType};base64,${image.data}`,
    })),
  ];
}

function getEventSessionId(payload: any): string | undefined {
  return (
    payload?.properties?.sessionID ||
    payload?.properties?.info?.sessionID ||
    payload?.properties?.part?.sessionID
  );
}

function getEventDirectory(event: any): string | undefined {
  return typeof event?.directory === 'string' ? event.directory : undefined;
}

async function loadOpenCodeSdk(): Promise<OpenCodeSdkModule | null> {
  try {
    return await Function('return import("@opencode-ai/sdk")')();
  } catch {
    return null;
  }
}

function handleOpenCodeSdkRequest(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  sessionId: string | undefined,
  cwd: string,
  openCodeOptions: OpenCodeOptions | undefined,
  callbacks: ProviderCallbacks,
): ProviderResult {
  const { sendSSE, onEnd } = callbacks;
  const normalizedOptions = withOpenCodeDefaultModel(openCodeOptions);
  const options = getOpenCodeAgentOptions(normalizedOptions);
  const sdkConfig =
    options.config && typeof options.config === 'object' ? options.config : {};
  const explicitModel =
    resolveModelValue(options.model) ||
    resolveModelValue(options?.config?.model);
  const explicitAgent = resolveModelValue(options.profile);
  const abortController = new AbortController();
  let activeSessionId = sessionId;
  let activeClient: any = null;
  let closeServer = () => {};
  let finished = false;
  let cleanedUp = false;
  let aborted = false;
  const textByPartId = new Map<string, string>();
  const toolStarted = new Set<string>();
  const toolFinished = new Set<string>();
  const editSnapshots = new Map<string, { filePath: string; before: string }>();
  const assistantMessageIds = new Set<string>();
  let activeAssistantMessageId = '';
  let announcedModel = '';

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    try {
      closeServer();
    } catch {
      // ignore
    }
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cleanup();
    sendSSE('[DONE]');
    onEnd();
  };

  const fail = (error: string) => {
    sendSSE({ error });
    finish();
  };

  (async () => {
    const sdk = await loadOpenCodeSdk();
    if (!sdk?.createOpencode) {
      sendSSE({
        type: 'text',
        content:
          '**OpenCode SDK not installed or unsupported.**\n\n' +
          'Please install a compatible SDK in your project:\n\n' +
          '```bash\nnpm install @opencode-ai/sdk\n```\n\n' +
          "Or use CLI mode by setting `type: 'cli'` in your config.",
      });
      finish();
      return;
    }

    try {
      sendSSE({
        type: 'info',
        message: 'Using OpenCode SDK package: @opencode-ai/sdk',
      });

      const { client, server } = await sdk.createOpencode({
        port: 0,
        config: sdkConfig,
      });
      activeClient = client;
      closeServer = () => server.close();

      const eventResult = await client.global.event({
        signal: abortController.signal,
      });

      if (!activeSessionId) {
        const created = await client.session.create({
          query: { directory: cwd },
          body: {},
        });
        activeSessionId = created?.data?.id;
        if (activeSessionId) {
          sendSSE({ type: 'session', sessionId: activeSessionId });
        }
      }

      if (!activeSessionId) {
        fail('Failed to create OpenCode session.');
        return;
      }

      const strippedHistory = history.map((item) => ({
        role: item.role,
        content: stripInlineImageDataUrls(item.content),
      }));
      const extracted = extractInlineImages(message);
      const promptText = sessionId
        ? buildResumeTurnPrompt(extracted.text, context, cwd)
        : buildPrompt(extracted.text, context, strippedHistory, cwd);
      const body: Record<string, any> = {
        agent: explicitAgent,
        parts: buildOpenCodePromptParts(promptText, extracted.images),
      };
      const parsedModel = parseOpenCodeModelRef(explicitModel);
      if (parsedModel) {
        body.model = parsedModel;
        announcedModel = `${parsedModel.providerID}/${parsedModel.modelID}`;
        sendSSE({ type: 'info', model: announcedModel });
      }

      const consumeEvents = (async () => {
        for await (const event of eventResult.stream) {
          if (aborted) break;
          if (!event || getEventDirectory(event) !== cwd) continue;
          const payload = event.payload;
          if (!payload) continue;

          const payloadSessionId = getEventSessionId(payload);
          if (payloadSessionId && payloadSessionId !== activeSessionId)
            continue;

          if (payload.type === 'message.updated') {
            const info = payload.properties?.info;
            if (!info || info.role !== 'assistant') continue;
            activeAssistantMessageId = info.id || activeAssistantMessageId;
            if (info.id) assistantMessageIds.add(info.id);
            if (!announcedModel && info.providerID && info.modelID) {
              announcedModel = `${info.providerID}/${info.modelID}`;
              sendSSE({ type: 'info', model: announcedModel });
            }
            const errorMessage =
              info.error?.data?.message ||
              info.error?.message ||
              info.error?.name;
            if (errorMessage) {
              fail(errorMessage);
              return;
            }
            continue;
          }

          if (payload.type === 'message.part.updated') {
            const part = payload.properties?.part;
            if (!part) continue;
            if (
              part.messageID &&
              !assistantMessageIds.has(part.messageID)
            ) {
              continue;
            }

            if (part.type === 'text') {
              const nextText =
                typeof payload.properties?.delta === 'string'
                  ? payload.properties.delta
                  : typeof part.text === 'string'
                    ? part.text.slice((textByPartId.get(part.id) || '').length)
                    : '';
              textByPartId.set(part.id, part.text || '');
              if (nextText) {
                sendSSE({ type: 'text', content: nextText });
              }
              continue;
            }

            if (part.type === 'tool') {
              const toolName = (part.tool || 'Tool').toLowerCase();
              const isEditTool = EDIT_TOOL_NAMES.has(toolName);
              const isCompleted =
                part.state?.status === 'completed' ||
                part.state?.status === 'error';

              if (!toolStarted.has(part.id)) {
                toolStarted.add(part.id);
                sendSSE({
                  type: 'tool_start',
                  toolId: part.id,
                  toolName: part.tool || 'Tool',
                });

                // Snapshot file before edit — only useful when tool
                // appears before completion (status pending/running).
                if (isEditTool && !isCompleted) {
                  const editPath = getEditFilePath(part.state?.input);
                  if (editPath) {
                    const absPath = path.isAbsolute(editPath)
                      ? editPath
                      : path.resolve(cwd, editPath);
                    const before = readFileContent(absPath);
                    if (before !== null) {
                      editSnapshots.set(part.id, {
                        filePath: editPath,
                        before,
                      });
                    }
                  }
                }
              }

              const rawInput = part.state?.input
                ? part.state.input
                : {};
              let enrichedInput: Record<string, any> = {
                _provider: 'opencode',
                ...rawInput,
              };

              if (
                !toolFinished.has(part.id) &&
                isCompleted
              ) {
                toolFinished.add(part.id);

                // Enrich edit tool input with before/after diff
                if (
                  isEditTool &&
                  part.state?.status === 'completed' &&
                  !enrichedInput.old_string &&
                  !enrichedInput.new_string &&
                  !enrichedInput.old_str &&
                  !enrichedInput.new_str
                ) {
                  const editPath =
                    getEditFilePath(rawInput) ||
                    editSnapshots.get(part.id)?.filePath ||
                    '';
                  if (editPath) {
                    const absPath = path.isAbsolute(editPath)
                      ? editPath
                      : path.resolve(cwd, editPath);
                    const snapshot = editSnapshots.get(part.id);
                    const beforeContent = snapshot?.before ?? null;
                    const afterContent = readFileContent(absPath);

                    if (
                      beforeContent !== null &&
                      afterContent !== null &&
                      beforeContent !== afterContent
                    ) {
                      enrichedInput = {
                        ...enrichedInput,
                        file_path: editPath,
                        old_string: beforeContent,
                        new_string: afterContent,
                      };
                    }
                  }
                }

                sendSSE({
                  type: 'tool_input',
                  toolUseId: part.id,
                  input: enrichedInput,
                });

                sendSSE({
                  type: 'tool_result',
                  toolUseId: part.id,
                  content:
                    part.state?.status === 'completed'
                      ? part.state.output || ''
                      : part.state?.error || '',
                  isError: part.state?.status === 'error',
                });
              } else {
                sendSSE({
                  type: 'tool_input',
                  toolUseId: part.id,
                  input: enrichedInput,
                });
              }
              continue;
            }

            if (part.type === 'patch' && Array.isArray(part.files)) {
              const patchId = part.id || `patch-${Date.now()}`;
              if (!toolStarted.has(patchId)) {
                toolStarted.add(patchId);
                sendSSE({
                  type: 'tool_start',
                  toolId: patchId,
                  toolName: 'Edit',
                });
              }

              const changes = part.files.map((f: any) => ({
                path: f?.path || '',
                kind: f?.status || 'edit',
              }));
              const firstPath = changes[0]?.path || '';

              sendSSE({
                type: 'tool_input',
                toolUseId: patchId,
                input: {
                  _provider: 'opencode',
                  file_path: firstPath,
                  changes,
                },
              });

              sendSSE({
                type: 'tool_result',
                toolUseId: patchId,
                content: `Patched ${part.files.length} file(s)`,
              });
              continue;
            }

            if (part.type === 'retry' && part.error?.data?.message) {
              sendSSE({
                type: 'info',
                message: part.error.data.message,
              });
              continue;
            }

            continue;
          }

          if (payload.type === 'session.error') {
            const errorMessage =
              payload.properties?.error?.data?.message ||
              payload.properties?.error?.message ||
              'OpenCode session error';
            fail(errorMessage);
            return;
          }

          if (payload.type === 'session.idle') {
            finish();
            return;
          }

          if (
            payload.type === 'tui.toast.show' &&
            payload.properties?.variant === 'error'
          ) {
            fail(payload.properties.message || 'OpenCode SDK error');
            return;
          }
        }
      })();

      await client.session.promptAsync({
        path: { id: activeSessionId },
        query: { directory: cwd },
        body,
      });

      await consumeEvents;
      if (!finished && !aborted) {
        finish();
      }
    } catch (error: any) {
      if (!aborted) {
        fail(error?.message || 'Failed to communicate with OpenCode SDK.');
      }
    } finally {
      cleanup();
    }
  })();

  return {
    abort: () => {
      aborted = true;
      abortController.abort();
      if (activeClient && activeSessionId) {
        Promise.resolve(
          activeClient.session.abort({
            path: { id: activeSessionId },
            query: { directory: cwd },
          }),
        ).catch(() => undefined);
      }
      cleanup();
    },
  };
}

export function handleOpenCodeRequest(
  message: string,
  context: AIContext | null,
  history: AIMessage[],
  sessionId: string | undefined,
  cwd: string,
  openCodeOptions: OpenCodeOptions | undefined,
  callbacks: ProviderCallbacks,
): ProviderResult {
  const normalizedOptions = withOpenCodeDefaultModel(openCodeOptions);

  if (openCodeOptions?.type === 'sdk') {
    return handleOpenCodeSdkRequest(
      message,
      context,
      history,
      sessionId,
      cwd,
      normalizedOptions,
      callbacks,
    );
  }

  return handleCodexRequest(
    message,
    context,
    history,
    sessionId,
    cwd,
    withOpenCodeDefaultModel(openCodeOptions) as any,
    callbacks,
    OPENCODE_PROVIDER_RUNTIME,
  );
}

export async function getModelInfo(
  openCodeOptions: OpenCodeOptions | undefined,
): Promise<string> {
  const options = getOpenCodeAgentOptions(
    withOpenCodeDefaultModel(openCodeOptions),
  );
  const explicitModel =
    resolveModelValue(options.model) ||
    resolveModelValue(options?.config?.model);
  if (explicitModel) {
    return explicitModel;
  }
  const model = await getCodexModelInfo(
    withOpenCodeDefaultModel(openCodeOptions) as any,
  );
  return model || OPENCODE_DEFAULT_MODEL;
}
