import { describe, expect, it, vi } from 'vitest';
import { __TEST_ONLY__, setProjectRoot } from '@/core/src/client/ai';

function templateText(tpl: any): string {
  if (tpl == null) return '';
  if (typeof tpl === 'string') return tpl;
  if (typeof tpl === 'number') return String(tpl);
  if (typeof tpl === 'boolean') return String(tpl);
  if (Array.isArray(tpl)) return tpl.map((item) => templateText(item)).join('');
  if (Array.isArray(tpl?.strings) && Array.isArray(tpl?.values)) {
    let out = '';
    for (let i = 0; i < tpl.strings.length; i++) {
      out += tpl.strings[i];
      if (i < tpl.values.length) {
        out += templateText(tpl.values[i]);
      }
    }
    return out;
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

  it('should normalize tool names across providers', () => {
    expect(__TEST_ONLY__.canonicalToolName('read')).toBe('Read');
    expect(__TEST_ONLY__.canonicalToolName('Read')).toBe('Read');
    expect(__TEST_ONLY__.canonicalToolName('edit')).toBe('Edit');
    expect(__TEST_ONLY__.canonicalToolName('bash')).toBe('Bash');
    expect(__TEST_ONLY__.canonicalToolName('websearch')).toBe('WebSearch');
    expect(__TEST_ONLY__.canonicalToolName('CustomTool')).toBe('CustomTool');
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
      name: 'Bash',
      summary: 'ls',
    });
    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: '1-0', name: 'Bash' } as any)).toEqual({
      name: 'Bash',
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
      name: 'Search',
      summary: 'vitest',
    });
    expect(
      __TEST_ONLY__.getCodexDisplayInfo({
        id: '3-0',
        name: 'WebSearch',
        input: {},
      } as any),
    ).toEqual({
      name: 'Search',
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
      name: 'Edited',
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
      name: 'Edited',
      summary: '2 files',
    });
    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: '3-2', name: 'Edit' } as any)).toEqual({
      name: 'Edited',
      summary: '',
    });

    expect(__TEST_ONLY__.getToolDisplayInfo({ id: '4', name: 'Read', input: { file_path: '/project/a.ts' } } as any)).toEqual({
      name: 'Read',
      summary: 'a.ts',
    });
    // Read with no input.file_path but result has <path> tag - fallback extraction
    expect(__TEST_ONLY__.getToolDisplayInfo({
      id: '4-1',
      name: 'Read',
      input: {},
      result: '<path>/project/src/b.ts</path>\n<type>file</type>\n<content>code</content>',
    } as any)).toEqual({
      name: 'Read',
      summary: 'src/b.ts',
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
    // OpenCode sends lowercase tool names - should still match
    expect(__TEST_ONLY__.getCodexDisplayInfo({ id: 'oc1', name: 'bash', input: { command: 'ls' } } as any)).toEqual({
      name: 'Bash',
      summary: 'ls',
    });
    expect(__TEST_ONLY__.getCodexDisplayInfo({
      id: 'oc2',
      name: 'read',
      isComplete: true,
      input: { _provider: 'opencode' },
      result: '<path>/project/src/x.ts</path>\n<content>code</content>',
    } as any)).toEqual({
      name: 'Read',
      summary: 'src/x.ts',
    });
  });

  it('should extract path and content from Read tool results', () => {
    // XML format with closing tag
    const xml1 = __TEST_ONLY__.extractReadContent(
      '<path>/a.vue</path>\n<type>file</type>\n<content>1: hello\n2: world</content>',
    );
    expect(xml1.path).toBe('/a.vue');
    expect(xml1.content).toBe('1: hello\n2: world');

    // XML format without closing tag (truncated)
    const xml2 = __TEST_ONLY__.extractReadContent(
      '<path>/a.vue</path>\n<type>file</type>\n<content>1: hello\n2: world',
    );
    expect(xml2.path).toBe('/a.vue');
    expect(xml2.content).toBe('1: hello\n2: world');

    // Plain text (no XML wrapper)
    const plain = __TEST_ONLY__.extractReadContent('just plain text');
    expect(plain.path).toBe('');
    expect(plain.content).toBe('just plain text');

    // JSON array format
    const json1 = __TEST_ONLY__.extractReadContent(
      '[{"type":"text","text":"<content>code here</content>"}]',
    );
    expect(json1.content).toBe('code here');

    // JSON array without XML
    const json2 = __TEST_ONLY__.extractReadContent(
      '[{"type":"text","text":"plain text in json"}]',
    );
    expect(json2.content).toBe('plain text in json');

    // Invalid JSON (not an array)
    const invalid = __TEST_ONLY__.extractReadContent('[invalid json');
    expect(invalid.content).toBe('[invalid json');
  });

  it('should format tool results and render tool blocks', () => {
    expect(__TEST_ONLY__.formatToolResult('', 'Read')).toBe('');
    expect(__TEST_ONLY__.formatToolResult('a\nb', 'Write')).toBe('Wrote 2 lines');
    expect(__TEST_ONLY__.formatToolResult('1\n2\n3\n4\n5\n6', 'Read')).toBe('6 lines');
    // Read with XML wrapper should extract content and show line count
    expect(__TEST_ONLY__.formatToolResult(
      '<path>/a.vue</path>\n<type>file</type>\n<content>1: line1\n2: line2\n3: line3</content>',
      'Read',
    )).toBe('3 lines');
    // Read with XML wrapper without closing tag
    expect(__TEST_ONLY__.formatToolResult(
      '<path>/a.vue</path>\n<type>file</type>\n<content>1: line1\n2: line2',
      'Read',
    )).toBe('2 lines');
    // Short Read result (no XML) should still show line count
    expect(__TEST_ONLY__.formatToolResult('a\nb', 'Read')).toBe('2 lines');
    // Read with JSON array format
    expect(__TEST_ONLY__.formatToolResult(
      '[{"type":"text","text":"<content>1: a\\n2: b</content>"}]',
      'Read',
    )).toBe('2 lines');
    // Lowercase tool names (OpenCode) should also work
    expect(__TEST_ONLY__.formatToolResult('a\nb\nc', 'read')).toBe('3 lines');
    expect(__TEST_ONLY__.formatToolResult('a\nb', 'write')).toBe('Wrote 2 lines');
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
    const diffText = templateText(diffTpl);
    expect(diffText).toContain('diff-view');
    expect(diffText).toContain('diff-lineno-old');
    expect(diffText).toContain('diff-lineno-new');
    // old: line 2 deleted, new: line 2 added
    expect(diffText).toMatch(/diff-lineno-old[\s\S]*?>\s*2[\s\S]*?<\/span[\s\S]*?>/);
    expect(diffText).toMatch(/diff-lineno-new[\s\S]*?>\s*2[\s\S]*?<\/span[\s\S]*?>/);

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

    // OpenCode lowercase "read" should render as read-result-block, not raw XML
    const opencodeReadTpl = __TEST_ONLY__.renderToolCall({
      id: 'oc-r1',
      name: 'read',
      input: { _provider: 'opencode' },
      isComplete: true,
      result: '<path>/a.vue</path>\n<type>file</type>\n<content>1: code\n2: more</content>',
      isError: false,
    } as any);
    const ocReadText = templateText(opencodeReadTpl);
    expect(ocReadText).toContain('read-result-block');
    expect(ocReadText).not.toContain('<path>');
    expect(ocReadText).not.toContain('<content>');

    // OpenCode lowercase "bash" should be suppressed
    const opencodeBashTpl = __TEST_ONLY__.renderToolCall({
      id: 'oc-b1',
      name: 'bash',
      input: { _provider: 'opencode', command: 'ls' },
      isComplete: true,
      result: 'output',
      isError: false,
    } as any);
    expect(templateText(opencodeBashTpl)).not.toContain('tool-result-inline');
  });

  it('should render context lines and collapse large gaps in diff view', () => {
    const oldSmallGap = ['1', 'a', '3', '4', '5', '6', '7', 'b'].join('\n');
    const newSmallGap = ['1', 'A', '3', '4', '5', '6', '7', 'B'].join('\n');
    const smallGapTpl = __TEST_ONLY__.renderEditDiff({
      id: 'gap-1',
      name: 'Edit',
      input: { old_string: oldSmallGap, new_string: newSmallGap },
    } as any);
    const smallGapText = templateText(smallGapTpl);
    expect(smallGapText).toContain('diff-ctx');
    expect(smallGapText).not.toContain('...5 lines');
    expect(smallGapText).toMatch(/diff-text[\s\S]*?>\s*3[\s\S]*?<\/span/);
    expect(smallGapText).toMatch(/diff-text[\s\S]*?>\s*7[\s\S]*?<\/span/);

    const oldLargeGap = ['1', 'a', '3', '4', '5', '6', '7', '8', 'b', '10'].join('\n');
    const newLargeGap = ['1', 'A', '3', '4', '5', '6', '7', '8', 'B', '10'].join('\n');
    const largeGapTpl = __TEST_ONLY__.renderEditDiff({
      id: 'gap-2',
      name: 'Edit',
      input: { old_string: oldLargeGap, new_string: newLargeGap },
    } as any);
    const largeGapText = templateText(largeGapTpl);
    expect(largeGapText).toContain('diff-gap');
    expect(largeGapText).toContain('...6 lines');
  });

  it('should render Read result as code preview', () => {
    // Read with XML content - renders as code block
    const readTpl = __TEST_ONLY__.renderReadResult({
      id: 'r1',
      name: 'Read',
      input: { file_path: 'a.vue' },
      result: '<path>/a.vue</path>\n<type>file</type>\n<content>1: line1\n2: line2\n3: line3</content>',
      isComplete: true,
    } as any);
    const readText = templateText(readTpl);
    expect(readText).toContain('read-result-block');
    expect(readText).toContain('read-line');
    expect(readText).not.toContain('<path>');
    expect(readText).not.toContain('<content>');

    // Read with long content - shows truncated with "+N lines"
    const longContent = Array.from({ length: 10 }, (_, i) => `${i + 1}: line${i + 1}`).join('\n');
    const longReadTpl = __TEST_ONLY__.renderReadResult({
      id: 'r2',
      name: 'Read',
      input: {},
      result: `<path>/a.ts</path>\n<type>file</type>\n<content>${longContent}</content>`,
      isComplete: true,
    } as any);
    const longText = templateText(longReadTpl);
    expect(longText).toContain('read-result-block');
    expect(longText).toContain('read-more');

    // Read with empty result
    const emptyReadTpl = __TEST_ONLY__.renderReadResult({
      id: 'r3',
      name: 'Read',
      input: {},
      result: '',
      isComplete: true,
    } as any);
    expect(templateText(emptyReadTpl)).toBe('');

    // Read result in renderToolCall uses read-result-block (not raw XML)
    const readToolTpl = __TEST_ONLY__.renderToolCall({
      id: 'r4',
      name: 'Read',
      input: { file_path: 'a.ts' },
      result: '<path>/a.ts</path>\n<content>1: code</content>',
      isComplete: true,
      isError: false,
    } as any);
    const toolText = templateText(readToolTpl);
    expect(toolText).toContain('read-result-block');
    expect(toolText).not.toContain('tool-result-text');
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
