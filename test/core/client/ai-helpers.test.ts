import { describe, expect, it, vi } from 'vitest';
import { __TEST_ONLY__, setProjectRoot } from '@/core/src/client/ai';

function templateText(tpl: any): string {
  if (tpl == null) return '';
  if (typeof tpl === 'string') return tpl;
  if (Array.isArray(tpl)) return tpl.map((item) => templateText(item)).join('');
  if (Array.isArray(tpl?.strings) && Array.isArray(tpl?.values)) {
    return tpl.strings.join('') + tpl.values.map((item: unknown) => templateText(item)).join('');
  }
  return '';
}

describe('client ai helper functions', () => {
  it('should format path, duration and provider labels', () => {
    setProjectRoot('/project');
    expect(__TEST_ONLY__.toRelativePath('/project/src/a.ts')).toBe('src/a.ts');
    setProjectRoot('/project/');
    expect(__TEST_ONLY__.toRelativePath('/project/src/b.ts')).toBe('src/b.ts');
    setProjectRoot('/project');
    expect(__TEST_ONLY__.toRelativePath('/other/a.ts')).toBe('/other/a.ts');
    expect(__TEST_ONLY__.formatDuration(59)).toBe('59s');
    expect(__TEST_ONLY__.formatDuration(121)).toBe('2m 01s');
    expect(__TEST_ONLY__.formatProviderName('codex')).toBe('Codex');
    expect(__TEST_ONLY__.formatProviderName('claudeCode')).toBe('Claude');
    expect(__TEST_ONLY__.normalizeChatProvider('codex')).toBe('codex');
    expect(__TEST_ONLY__.normalizeChatProvider('claudeCode')).toBe('claudeCode');
    expect(__TEST_ONLY__.normalizeChatProvider('x')).toBeNull();
  });

  it('should render markdown content', () => {
    expect(__TEST_ONLY__.renderMarkdown('**hi**')).toContain('<strong>hi</strong>');
  });

  it('should fallback to escaped html when markdown parser throws', async () => {
    const markedModule = await import(
      '../../../packages/core/node_modules/marked/lib/marked.esm.js'
    );
    const parseSpy = vi
      .spyOn(markedModule.marked, 'parse')
      .mockImplementationOnce(() => {
        throw new Error('parse-failed');
      });

    const rendered = __TEST_ONLY__.renderMarkdown('<x>&\nline');
    expect(rendered).toBe('&lt;x&gt;&amp;<br>line');
    parseSpy.mockRestore();
  });

  it('should compute tool summaries', () => {
    setProjectRoot('/project');
    expect(__TEST_ONLY__.isCodexTool({ id: '1', name: 'Read', input: { _provider: 'codex' } } as any)).toBe(
      true,
    );
    expect(__TEST_ONLY__.getChangePath({ file_path: 'a.ts' })).toBe('a.ts');
    expect(__TEST_ONLY__.getChangePath({ changes: [{ path: 'b.ts' }] })).toBe('b.ts');
    expect(__TEST_ONLY__.getChangePath({})).toBe('');

    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: '1', name: 'Bash', input: { command: 'ls' } } as any)).toEqual({
      name: 'Running',
      summary: 'ls',
    });
    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: '1-0', name: 'Bash' } as any)).toEqual({
      name: 'Running',
      summary: '',
    });
    expect(
      __TEST_ONLY__.getCodexDisplayInfo({
        id: '2',
        name: 'Edit',
        isComplete: true,
        input: { file_path: '/project/src/a.ts' },
      } as any),
    ).toEqual({
      name: 'Edited',
      summary: 'src/a.ts',
    });
    expect(
      __TEST_ONLY__.getCodexDisplayInfo({
        id: '3',
        name: 'WebSearch',
        isComplete: true,
        input: { query: 'vitest' },
      } as any),
    ).toEqual({
      name: 'Explored',
      summary: 'vitest',
    });
    expect(
      __TEST_ONLY__.getCodexDisplayInfo({
        id: '3-0',
        name: 'WebSearch',
        input: {},
      } as any),
    ).toEqual({
      name: 'Exploring',
      summary: '',
    });
    expect(
      __TEST_ONLY__.getCodexDisplayInfo({
        id: '3-1',
        name: 'Edit',
        isComplete: false,
        input: { changes: [{}] },
      } as any),
    ).toEqual({
      name: 'Editing',
      summary: '1 file',
    });
    expect(
      __TEST_ONLY__.getCodexDisplayInfo({
        id: '3-1b',
        name: 'Edit',
        isComplete: false,
        input: { changes: [{}, {}] },
      } as any),
    ).toEqual({
      name: 'Editing',
      summary: '2 files',
    });
    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: '3-2', name: 'Edit' } as any)).toEqual({
      name: 'Editing',
      summary: '',
    });

    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '4', name: 'Read', input: { file_path: '/project/a.ts' } } as any)).toEqual({
      name: 'Read',
      summary: 'a.ts',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '4-0', name: 'Read' } as any)).toEqual({
      name: 'Read',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '5', name: 'Write', input: { file_path: '/project/b.ts' } } as any)).toEqual({
      name: 'Write',
      summary: 'b.ts',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '5-0', name: 'Write' } as any)).toEqual({
      name: 'Write',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '6', name: 'Edit', input: { file_path: '/project/c.ts' } } as any)).toEqual({
      name: 'Update',
      summary: 'c.ts',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '6-0', name: 'Edit' } as any)).toEqual({
      name: 'Update',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '7', name: 'Glob', input: { pattern: '*.ts' } } as any)).toEqual({
      name: 'List',
      summary: '*.ts',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '7-0', name: 'Glob', input: {} } as any)).toEqual({
      name: 'List',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '8', name: 'Grep', input: { pattern: 'foo' } } as any)).toEqual({
      name: 'Search',
      summary: 'foo',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '8-0', name: 'Grep', input: {} } as any)).toEqual({
      name: 'Search',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '8-1', name: 'Bash', input: { command: 'pwd' } } as any)).toEqual({
      name: 'Bash',
      summary: 'pwd',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '8-2', name: 'Bash', input: {} } as any)).toEqual({
      name: 'Bash',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '9', name: 'WebFetch', input: { url: 'https://x' } } as any)).toEqual({
      name: 'Fetch',
      summary: 'https://x',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '9-0', name: 'WebFetch', input: {} } as any)).toEqual({
      name: 'Fetch',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '9-1', name: 'WebSearch', input: { query: 'q' } } as any)).toEqual({
      name: 'Search',
      summary: 'q',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '9-1b', name: 'WebSearch', input: {} } as any)).toEqual({
      name: 'Search',
      summary: '',
    });
    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '9-2', name: 'Unknown', input: {} } as any)).toEqual({
      name: 'Unknown',
      summary: '',
    });
    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: 'x', name: 'Unknown', input: {} } as any)).toEqual({
      name: 'Unknown',
      summary: '',
    });
  });

  it('should format tool results and render tool blocks', () => {
    expect(__TEST_ONLY__.formatToolResult('', 'Read')).toBe('');
    expect(__TEST_ONLY__.formatToolResult('a\nb', 'Write')).toBe('Wrote 2 lines');
    expect(__TEST_ONLY__.formatToolResult('1\n2\n3\n4\n5\n6', 'Read')).toBe('6 lines');
    expect(__TEST_ONLY__.formatToolResult('x'.repeat(400), 'Bash')).toContain('...');

    const diffTpl = __TEST_ONLY__.renderEditDiff({
      id: '1',
      name: 'Edit',
      input: {
        diff_blocks: [
          {
            file_path: '/project/src/a.ts',
            old_string: 'const a = 1;\nconst b = 2;',
            new_string: 'const a = 1;\nconst b = 3;',
          },
        ],
      },
    } as any);
    expect(templateText(diffTpl)).toContain('diff-view');

    const sectionDiff = __TEST_ONLY__.renderEditDiff({
      id: '2',
      name: 'Edit',
      input: {
        old_string: '# src/a.ts\nconst a = 1;',
        new_string: '# src/a.ts\nconst a = 2;',
        changes: [{ path: 'src/a.ts', kind: 'edit' }],
      },
    } as any);
    expect(templateText(sectionDiff)).toContain('diff-view');

    const emptyDiff = __TEST_ONLY__.renderEditDiff({ id: '2-1', name: 'Edit', input: {} } as any);
    expect(templateText(emptyDiff)).toBe('');

    const noInputDiff = __TEST_ONLY__.renderEditDiff({ id: '2-1b', name: 'Edit' } as any);
    expect(templateText(noInputDiff)).toBe('');

    const hugeOld = Array.from({ length: 501 }, (_, i) => `a-${i}`).join('\n');
    const hugeNew = Array.from({ length: 501 }, (_, i) => (i === 250 ? `b-${i}` : `a-${i}`)).join('\n');
    const hugeDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-2',
      name: 'Edit',
      input: { old_string: hugeOld, new_string: hugeNew },
    } as any);
    expect(templateText(hugeDiff)).toContain('diff-view');

    const changeFallbackDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-3',
      name: 'Edit',
      input: {
        old_string: 'x',
        new_string: 'y',
        changes: [{ path: '' }],
      },
    } as any);
    expect(templateText(changeFallbackDiff)).toContain('diff-view');

    const trailingNewlineDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-4',
      name: 'Edit',
      input: {
        old_string: 'a\n',
        new_string: 'a\nb\n',
      },
    } as any);
    expect(templateText(trailingNewlineDiff)).toContain('diff-view');

    const removedTailDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-5',
      name: 'Edit',
      input: {
        old_string: 'a\nb',
        new_string: 'a',
      },
    } as any);
    expect(templateText(removedTailDiff)).toContain('diff-view');

    const addPreferredDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-6',
      name: 'Edit',
      input: {
        old_string: 'y',
        new_string: 'x\ny',
      },
    } as any);
    expect(templateText(addPreferredDiff)).toContain('diff-view');

    const emptyBlockDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-7',
      name: 'Edit',
      input: { diff_blocks: [{}] },
    } as any);
    expect(templateText(emptyBlockDiff)).toBe('');

    const onlyAddDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-8',
      name: 'Edit',
      input: { diff_blocks: [{ old_string: '', new_string: 'x' }] },
    } as any);
    expect(templateText(onlyAddDiff)).toContain('diff-view');

    const onlyDelDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-9',
      name: 'Edit',
      input: { diff_blocks: [{ old_string: 'x', new_string: '' }] },
    } as any);
    expect(templateText(onlyDelDiff)).toContain('diff-view');

    const sectionMissingPathDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-10',
      name: 'Edit',
      input: {
        old_string: '# src/a.ts\nold',
        new_string: '# src/a.ts\nnew',
        changes: [{}],
      },
    } as any);
    expect(templateText(sectionMissingPathDiff)).toContain('diff-view');

    const sectionNoDeltaDiff = __TEST_ONLY__.renderEditDiff({
      id: '2-11',
      name: 'Edit',
      input: {
        old_string: '# src/a.ts\nsame',
        new_string: '# src/a.ts\nsame',
        changes: [{ path: 'missing.ts' }],
      },
    } as any);
    expect(templateText(sectionNoDeltaDiff)).toContain('diff-view');

    const toolTpl = __TEST_ONLY__.renderToolCall({
      id: '3',
      name: 'Bash',
      input: { _provider: 'codex', command: 'ls' },
      isComplete: true,
      result: 'ok',
    } as any);
    expect(templateText(toolTpl)).toContain('tool-call-inline');

    const suppressed = __TEST_ONLY__.renderToolCall({
      id: '3-1',
      name: 'Bash',
      input: { _provider: 'codex', command: 'ls' },
      isComplete: true,
      result: 'hidden',
      isError: false,
    } as any);
    expect(templateText(suppressed)).not.toContain('tool-result-inline');

    const suppressedWebSearch = __TEST_ONLY__.renderToolCall({
      id: '3-1b',
      name: 'WebSearch',
      input: { _provider: 'codex', query: 'x' },
      isComplete: true,
      result: 'hidden',
      isError: false,
    } as any);
    expect(templateText(suppressedWebSearch)).not.toContain('tool-result-inline');

    const toolError = __TEST_ONLY__.renderToolCall({
      id: '3-2',
      name: 'Read',
      input: { file_path: 'a.ts' },
      isComplete: true,
      result: 'failed',
      isError: true,
    } as any);
    expect(templateText(toolError)).toContain('tool-error-text');

    const diffBlockTool = __TEST_ONLY__.renderToolCall({
      id: '3-3',
      name: 'Edit',
      input: {
        diff_blocks: [
          { old_string: 'a', new_string: 'b' },
        ],
      },
      isComplete: false,
    } as any);
    expect(templateText(diffBlockTool)).toContain('tool-diff-wrapper');
  });

  it('should render message content/context for key scenarios', () => {
    const blockTpl = __TEST_ONLY__.renderMessageContent({
      role: 'assistant',
      content: '',
      blocks: [
        { type: 'text', content: '**hello**' },
        {
          type: 'tool',
          tool: { id: 't1', name: 'Read', input: { file_path: 'a.ts' }, result: 'ok', isComplete: true },
        },
      ],
    } as any);
    expect(Array.isArray((blockTpl as any).values)).toBe(true);

    const imgTpl = __TEST_ONLY__.renderMessageContent({
      role: 'user',
      content: 'question',
      images: [{ id: '1', name: 'a.png', previewUrl: 'data:image/png;base64,a' }],
    } as any);
    expect(templateText(imgTpl)).toContain('chat-image-grid');

    const imgFallbackTpl = __TEST_ONLY__.renderMessageContent({
      role: 'user',
      content: '',
      images: [{ id: '2', name: '', previewUrl: 'data:image/png;base64,b' }],
    } as any);
    expect(templateText(imgFallbackTpl)).toContain('pasted-image');

    const plainAssistant = __TEST_ONLY__.renderMessageContent({
      role: 'assistant',
      content: '*a*',
    } as any);
    expect(templateText(plainAssistant)).toContain('chat-markdown');

    const contextTpl = __TEST_ONLY__.renderMessageContext({
      role: 'user',
      content: 'hi',
      context: { name: 'Button', file: '/project/src/a.ts', line: 10, column: 1 },
    } as any);
    expect(templateText(contextTpl)).toContain('chat-message-context');

    const emptyContext = __TEST_ONLY__.renderMessageContext({
      role: 'assistant',
      content: 'x',
      context: { name: 'Button', file: '/project/src/a.ts', line: 10, column: 1 },
    } as any);
    expect(templateText(emptyContext)).toBe('');

    const unknownBlockTpl = __TEST_ONLY__.renderMessageContent({
      role: 'assistant',
      content: '',
      blocks: [{ type: 'text' }, { type: 'tool' }, { type: 'unknown' as any }],
    } as any);
    expect(Array.isArray((unknownBlockTpl as any).values)).toBe(true);

    const userBlockTpl = __TEST_ONLY__.renderMessageContent({
      role: 'user',
      content: '',
      blocks: [{ type: 'text', content: 'plain user block' }],
    } as any);
    expect(templateText(userBlockTpl)).toContain('plain user block');
  });
});
