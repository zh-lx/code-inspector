import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';
import {
  isLikelyTypeScriptGeneric,
  isNonInjectableScannedTag,
  isScannableDomTag,
  isWellFormedScannedTag,
  shouldSkipScannedTagChildren,
} from './scan-html-tag';

type Range = {
  start: number;
  end: number;
};

type MdxLine = {
  number: number;
  start: number;
  end: number;
  text: string;
};

type ListItem = {
  kind: 'ul' | 'ol';
  indent: number;
  line: MdxLine;
  markerColumn: number;
  text: string;
};

type ListGroup = {
  kind: 'ul' | 'ol';
  indent: number;
  items: ListItem[];
  start: number;
  end: number;
  unsafe: boolean;
};

type ScannerState = {
  quote: string;
  depth: number;
};

type MdxParser = {
  createProcessor?: (options?: Record<string, unknown>) => {
    parse: (content: string) => MdxNode;
  };
};

type MdxNode = {
  type: string;
  name?: string | null;
  attributes?: Array<{ name?: string | null }>;
  children?: MdxNode[];
  position?: {
    start?: {
      line?: number;
      column?: number;
      offset?: number;
    };
  };
};

const mdxParserCache = new Map<string, MdxParser | null>();

export async function transformMdx(
  content: string,
  filePath: string,
  escapeTags: EscapeTags,
  resolveFilePath = filePath,
) {
  const ast = await parseMdxAst(content, resolveFilePath);
  if (ast) {
    return transformMdxByAst(content, filePath, escapeTags, ast);
  }

  return transformMdxByScan(content, filePath, escapeTags);
}

async function resolveMdxParser(filePath: string): Promise<MdxParser | null> {
  const resolveDir = fs.existsSync(filePath) ? path.dirname(filePath) : filePath;
  if (mdxParserCache.has(resolveDir)) {
    return mdxParserCache.get(resolveDir) || null;
  }

  try {
    const requireFromFile = createRequire(path.join(resolveDir, 'noop.js'));
    const mdxPath = requireFromFile.resolve('@mdx-js/mdx');
    const mdxModule = await import(pathToFileURL(mdxPath).href);
    const parser = normalizeMdxParser(mdxModule);
    mdxParserCache.set(resolveDir, parser);
    return parser;
  } catch (error) {
    mdxParserCache.set(resolveDir, null);
    return null;
  }
}

function normalizeMdxParser(mdxModule: unknown): MdxParser | null {
  const seen = new Set<unknown>();
  let current = mdxModule;

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);

    const moduleRecord = current as MdxParser & { default?: unknown };
    if (typeof moduleRecord.createProcessor === 'function') {
      return moduleRecord;
    }

    current = moduleRecord.default;
  }

  return null;
}

async function parseMdxAst(content: string, filePath: string) {
  const parser = await resolveMdxParser(filePath);
  if (!parser?.createProcessor) {
    return null;
  }

  try {
    return parser.createProcessor({ jsx: true }).parse(content);
  } catch (error) {
    return null;
  }
}

function transformMdxByAst(
  content: string,
  filePath: string,
  escapeTags: EscapeTags,
  ast: MdxNode,
) {
  const s = new MagicString(content);
  const ignoredRanges = getIgnoredRanges(content);
  const lines = getLines(content);
  const rewrittenRanges = injectMarkdownBlockPaths(
    s,
    lines,
    ignoredRanges,
    filePath,
    escapeTags,
  );

  injectExplicitAstTagPaths(
    content,
    s,
    [...ignoredRanges, ...rewrittenRanges],
    ast,
    filePath,
    escapeTags,
    getMdxDynamicRootOffsets(ast, escapeTags),
  );

  return s.toString();
}

function transformMdxByScan(
  content: string,
  filePath: string,
  escapeTags: EscapeTags,
) {
  const s = new MagicString(content);
  const ignoredRanges = getIgnoredRanges(content);
  const lines = getLines(content);
  const rewrittenRanges = injectMarkdownBlockPaths(
    s,
    lines,
    ignoredRanges,
    filePath,
    escapeTags,
  );

  injectExplicitTagPaths(
    content,
    s,
    [...ignoredRanges, ...rewrittenRanges],
    filePath,
    escapeTags,
  );

  return s.toString();
}

function injectMarkdownBlockPaths(
  s: MagicString,
  lines: MdxLine[],
  ignoredRanges: Range[],
  filePath: string,
  escapeTags: EscapeTags,
) {
  const rewrittenRanges: Range[] = [];
  const listGroups = collectListGroups(lines, ignoredRanges);
  const skippedMarkdownRanges = listGroups
    .filter((group) => group.unsafe)
    .map(({ start, end }) => ({ start, end }));

  listGroups.forEach((group) => {
    if (
      group.unsafe ||
      isEscapeTags(escapeTags, group.kind) ||
      isEscapeTags(escapeTags, 'li')
    ) {
      return;
    }

    const firstItem = group.items[0];
    const lastItem = group.items[group.items.length - 1];

    group.items.forEach((item) => {
      let replacement = `<li${getMdxPathAttribute(
        filePath,
        item.line.number,
        item.markerColumn,
        'li',
      )}>${renderInlineMarkdown(item.text)}</li>`;

      if (item === firstItem) {
        replacement = `<${group.kind}${getMdxPathAttribute(
          filePath,
          item.line.number,
          item.markerColumn,
          group.kind,
        )}>\n${replacement}`;
      }

      if (item === lastItem) {
        replacement += `\n</${group.kind}>`;
      }

      s.overwrite(item.line.start, item.line.end, replacement);
      rewrittenRanges.push({ start: item.line.start, end: item.line.end });
    });
  });

  lines.forEach((line, lineIndex) => {
    if (
      isOffsetInRanges(line.start, ignoredRanges) ||
      isOffsetInRanges(line.start, skippedMarkdownRanges) ||
      isOffsetInRanges(line.start, rewrittenRanges)
    ) {
      return;
    }

    const heading = readHeading(line);
    if (heading && !isEscapeTags(escapeTags, heading.tag)) {
      s.overwrite(
        line.start,
        line.end,
        `<${heading.tag}${getMdxPathAttribute(
          filePath,
          line.number,
          heading.column,
          heading.tag,
        )}>${renderInlineMarkdown(heading.text)}</${heading.tag}>`,
      );
      rewrittenRanges.push({ start: line.start, end: line.end });
      return;
    }

    const blockquote = readBlockquote(line);
    if (
      blockquote &&
      isSingleLineMarkdownBlock(lines, lineIndex, ignoredRanges) &&
      !isEscapeTags(escapeTags, 'blockquote') &&
      !isEscapeTags(escapeTags, 'p')
    ) {
      s.overwrite(
        line.start,
        line.end,
        `<blockquote${getMdxPathAttribute(
          filePath,
          line.number,
          blockquote.quoteColumn,
          'blockquote',
        )}><p${getMdxPathAttribute(
          filePath,
          line.number,
          blockquote.textColumn,
          'p',
        )}>${renderInlineMarkdown(blockquote.text)}</p></blockquote>`,
      );
      rewrittenRanges.push({ start: line.start, end: line.end });
    }
  });

  return rewrittenRanges;
}

function collectListGroups(lines: MdxLine[], ignoredRanges: Range[]) {
  const groups: ListGroup[] = [];
  let current: ListGroup | null = null;

  const finishCurrent = () => {
    if (current) {
      groups.push(current);
      current = null;
    }
  };

  lines.forEach((line) => {
    if (isOffsetInRanges(line.start, ignoredRanges) || line.text.trim() === '') {
      finishCurrent();
      return;
    }

    const item = readListItem(line);
    if (!item) {
      if (current) {
        current.unsafe = true;
        current.end = line.end;
      }
      return;
    }

    if (!current) {
      current = createListGroup(item);
      return;
    }

    if (current.unsafe && item.indent >= current.indent) {
      if (current.kind === item.kind && current.indent === item.indent) {
        current.items.push(item);
      }
      current.end = item.line.end;
      return;
    }

    if (item.indent > current.indent) {
      current.unsafe = true;
      current.end = item.line.end;
      return;
    }

    if (current.kind !== item.kind || current.indent !== item.indent) {
      finishCurrent();
      current = createListGroup(item);
      return;
    }

    current.items.push(item);
    current.end = item.line.end;
  });

  finishCurrent();
  return groups;
}

function createListGroup(item: ListItem): ListGroup {
  return {
    kind: item.kind,
    indent: item.indent,
    items: [item],
    start: item.line.start,
    end: item.line.end,
    unsafe: item.indent > 0,
  };
}

function injectExplicitAstTagPaths(
  content: string,
  s: MagicString,
  ignoredRanges: Range[],
  ast: MdxNode,
  filePath: string,
  escapeTags: EscapeTags,
  dynamicRootOffsets = new Set<number>(),
) {
  walkMdxNodes(ast, (node) => {
    injectMdxAstNodePath(
      content,
      s,
      ignoredRanges,
      node,
      filePath,
      escapeTags,
      dynamicRootOffsets,
    );
  });
}

function walkMdxNodes(node: MdxNode, callback: (node: MdxNode) => void) {
  callback(node);
  if (node.name && shouldSkipScannedTagChildren(node.name)) {
    return;
  }
  node.children?.forEach((child) => walkMdxNodes(child, callback));
}

function injectMdxAstNodePath(
  content: string,
  s: MagicString,
  ignoredRanges: Range[],
  node: MdxNode,
  filePath: string,
  escapeTags: EscapeTags,
  dynamicRootOffsets = new Set<number>(),
) {
  if (!isInjectableMdxAstNode(node, escapeTags) || hasMdxAstPathAttribute(node)) {
    return;
  }

  const start = node.position?.start;
  if (
    typeof start?.offset !== 'number' ||
    typeof start.line !== 'number' ||
    typeof start.column !== 'number' ||
    !node.name ||
    isOffsetInRanges(start.offset, ignoredRanges)
  ) {
    return;
  }

  const insertPosition = findOpeningTagInsertPosition(content, start.offset);
  if (
    insertPosition === -1 ||
    hasPathAttributeInSource(content.slice(start.offset, insertPosition))
  ) {
    return;
  }

  s.prependLeft(
    insertPosition,
    getMdxPathAttribute(
      filePath,
      start.line,
      start.column,
      node.name,
      dynamicRootOffsets.has(start.offset)
        ? `props && props[${JSON.stringify(PathName)}]`
        : '',
    ),
  );
}

function isInjectableMdxAstNode(node: MdxNode, escapeTags: EscapeTags) {
  return Boolean(
    (node.type === 'mdxJsxFlowElement' ||
      node.type === 'mdxJsxTextElement') &&
      node.name &&
      isScannableDomTag(node.name) &&
      !isNonInjectableScannedTag(node.name) &&
      !isEscapeTags(escapeTags, node.name),
  );
}

function hasMdxAstPathAttribute(node: MdxNode) {
  return node.attributes?.some((attr) => attr.name === PathName);
}

function getMdxDynamicRootOffsets(ast: MdxNode, escapeTags: EscapeTags) {
  const renderRoots = (ast.children || []).filter(isRenderableMdxRootNode);
  if (
    renderRoots.length !== 1 ||
    !isInjectableMdxAstNode(renderRoots[0], escapeTags)
  ) {
    return new Set<number>();
  }

  const offset = renderRoots[0].position?.start?.offset;
  return typeof offset === 'number' ? new Set([offset]) : new Set<number>();
}

function isRenderableMdxRootNode(node: MdxNode) {
  return (
    node.type !== 'mdxjsEsm' &&
    node.type !== 'definition' &&
    node.type !== 'footnoteDefinition'
  );
}

function injectExplicitTagPaths(
  content: string,
  s: MagicString,
  ignoredRanges: Range[],
  filePath: string,
  escapeTags: EscapeTags,
) {
  const lineStarts = getLineStarts(content);
  let index = 0;

  while (index < content.length) {
    const ignoredRange = findRangeAtOffset(index, ignoredRanges);
    if (ignoredRange) {
      index = ignoredRange.end;
      continue;
    }

    const tagStart = content.indexOf('<', index);
    if (tagStart === -1) {
      break;
    }

    const tagIgnoredRange = findRangeAtOffset(tagStart, ignoredRanges);
    if (tagIgnoredRange) {
      index = tagIgnoredRange.end;
      continue;
    }

    const tagInfo = readTagName(content, tagStart);
    if (!tagInfo) {
      index = tagStart + 1;
      continue;
    }

    const { name } = tagInfo;
    const insertPosition = findOpeningTagInsertPosition(content, tagStart);
    if (insertPosition === -1) {
      break;
    }

    if (
      shouldInjectTag(content, tagStart, insertPosition, name, escapeTags) &&
      !hasPathAttributeInSource(content.slice(tagStart, insertPosition))
    ) {
      const position = getLineColumn(lineStarts, tagStart);
      s.prependLeft(
        insertPosition,
        getMdxPathAttribute(
          filePath,
          position.line,
          position.column,
          name,
        ),
      );
    }

    const lowerName = name.toLowerCase();
    if (
      shouldSkipScannedTagChildren(name) ||
      isEscapeTags(escapeTags, lowerName)
    ) {
      const closeTag = `</${lowerName}`;
      const closeIndex = content.toLowerCase().indexOf(closeTag, insertPosition);
      if (closeIndex !== -1) {
        const closeEnd = content.indexOf('>', closeIndex);
        if (closeEnd !== -1) {
          index = closeEnd + 1;
          continue;
        }
      }
    }

    index = insertPosition + 1;
  }
}

function readHeading(line: MdxLine) {
  const match = /^(\s*)(#{1,6})[ \t]+(.+?)[ \t]*$/.exec(line.text);
  if (!match) {
    return null;
  }

  return {
    tag: `h${match[2].length}`,
    column: match[1].length + 1,
    text: stripAtxClosingSequence(match[3]),
  };
}

function stripAtxClosingSequence(value: string) {
  const match = /^(.*?)[ \t]+#{1,}[ \t]*$/.exec(value);
  return match ? match[1] : value;
}

function readBlockquote(line: MdxLine) {
  const match = /^(\s*)>\s+(.+)$/.exec(line.text);
  if (!match) {
    return null;
  }

  return {
    quoteColumn: match[1].length + 1,
    textColumn: line.text.indexOf(match[2]) + 1,
    text: match[2],
  };
}

function isSingleLineMarkdownBlock(
  lines: MdxLine[],
  lineIndex: number,
  ignoredRanges: Range[],
) {
  return (
    isBlankOrBoundaryLine(lines[lineIndex - 1], ignoredRanges) &&
    isBlankOrBoundaryLine(lines[lineIndex + 1], ignoredRanges)
  );
}

function isBlankOrBoundaryLine(line: MdxLine | undefined, ignoredRanges: Range[]) {
  return (
    !line ||
    isOffsetInRanges(line.start, ignoredRanges) ||
    line.text.trim() === ''
  );
}

function readListItem(line: MdxLine): ListItem | null {
  const unordered = /^(\s*)[-*+]\s+(.+)$/.exec(line.text);
  if (unordered) {
    return {
      kind: 'ul',
      indent: unordered[1].length,
      line,
      markerColumn: unordered[1].length + 1,
      text: unordered[2],
    };
  }

  const ordered = /^(\s*)\d+\.\s+(.+)$/.exec(line.text);
  if (ordered) {
    return {
      kind: 'ol',
      indent: ordered[1].length,
      line,
      markerColumn: ordered[1].length + 1,
      text: ordered[2],
    };
  }

  return null;
}

function getIgnoredRanges(content: string) {
  const ranges: Range[] = [];
  const frontmatterEnd = getFrontmatterEndOffset(content);
  if (frontmatterEnd > 0) {
    ranges.push({ start: 0, end: frontmatterEnd });
  }

  let openFence: { start: number; marker: string; length: number } | null = null;
  for (const line of getLines(content)) {
    if (line.start < frontmatterEnd) {
      continue;
    }

    const trimmed = line.text.trimStart();
    if (!openFence) {
      const match = /^(`{3,}|~{3,})/.exec(trimmed);
      if (match) {
        openFence = {
          start: line.start,
          marker: match[1][0],
          length: match[1].length,
        };
      }
      continue;
    }

    const closeFence = new RegExp(
      `^${escapeRegExp(openFence.marker)}{${openFence.length},}(?:\\s|$)`,
    );
    if (closeFence.test(trimmed)) {
      ranges.push({ start: openFence.start, end: line.end });
      openFence = null;
    }
  }

  if (openFence) {
    ranges.push({ start: openFence.start, end: content.length });
  }

  ranges.push(...getMdxEsmRanges(getLines(content), ranges, frontmatterEnd));
  return ranges.sort((a, b) => a.start - b.start);
}

function readTagName(content: string, tagStart: number) {
  const next = content[tagStart + 1];
  if (
    !next ||
    next === '/' ||
    next === '!' ||
    next === '?' ||
    next === '>' ||
    /\s/.test(next)
  ) {
    return null;
  }

  const match = /^[A-Za-z][A-Za-z0-9:_-]*/.exec(content.slice(tagStart + 1));
  if (!match) {
    return null;
  }

  return { name: match[0] };
}

function findOpeningTagInsertPosition(content: string, tagStart: number) {
  let quote = '';
  let braceDepth = 0;

  for (let i = tagStart + 1; i < content.length; i++) {
    const char = content[i];
    const prev = content[i - 1];

    if (quote) {
      if (char === quote && prev !== '\\') {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      braceDepth++;
      continue;
    }

    if (char === '}' && braceDepth > 0) {
      braceDepth--;
      continue;
    }

    if (char === '>' && braceDepth === 0) {
      return content[i - 1] === '/' ? i - 1 : i;
    }
  }

  return -1;
}

function shouldInjectTag(
  content: string,
  tagStart: number,
  insertPosition: number,
  name: string,
  escapeTags: EscapeTags,
) {
  return (
    isScannableDomTag(name) &&
    !isNonInjectableScannedTag(name) &&
    !isEscapeTags(escapeTags, name) &&
    !isLikelyTypeScriptGeneric(content, tagStart) &&
    isWellFormedScannedTag(content, insertPosition, name)
  );
}

function hasPathAttributeInSource(openingTag: string) {
  return new RegExp(`\\s${PathName}(?:\\s|=|$)`).test(openingTag);
}

function getMdxPathAttribute(
  filePath: string,
  line: number,
  column: number,
  name: string,
  propagatedPathExpression = '',
) {
  const pathValue = JSON.stringify(`${filePath}:${line}:${column}:${name}`);
  if (propagatedPathExpression) {
    return ` ${PathName}={${propagatedPathExpression} || ${pathValue}}`;
  }

  return ` ${PathName}=${JSON.stringify(
    `${filePath}:${line}:${column}:${name}`,
  )}`;
}

function getFrontmatterEndOffset(content: string) {
  if (!content.startsWith('---')) {
    return 0;
  }

  const match = /\n---(?:\r?\n|$)/.exec(content.slice(3));
  return match ? 3 + match.index + match[0].length : 0;
}

function getLines(content: string) {
  const lines: MdxLine[] = [];
  const lineRegex = /.*(?:\r?\n|$)/g;
  let match: RegExpExecArray | null;
  let offset = 0;
  let lineNumber = 1;

  while ((match = lineRegex.exec(content))) {
    const rawLine = match[0];
    if (rawLine === '') {
      break;
    }

    const newline = /\r?\n$/.exec(rawLine)?.[0] || '';
    const text = newline ? rawLine.slice(0, -newline.length) : rawLine;
    lines.push({
      number: lineNumber,
      start: offset,
      end: offset + text.length,
      text,
    });
    offset += rawLine.length;
    lineNumber++;
  }

  return lines;
}

function getLineStarts(content: string) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

function getLineColumn(lineStarts: number[], offset: number) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const lineIndex = Math.max(0, high);
  return {
    line: lineIndex + 1,
    column: offset - lineStarts[lineIndex] + 1,
  };
}

function isOffsetInRanges(offset: number, ranges: Range[]) {
  return Boolean(findRangeAtOffset(offset, ranges));
}

function findRangeAtOffset(offset: number, ranges: Range[]) {
  return ranges.find((range) => offset >= range.start && offset < range.end);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderInlineMarkdown(value: string): string {
  let result = '';
  let index = 0;

  while (index < value.length) {
    const char = value[index];

    if (char === '\\' && index + 1 < value.length) {
      result += renderPlainInlineChar(value[index + 1]);
      index += 2;
      continue;
    }

    if (char === '`') {
      const code = readInlineCode(value, index);
      if (code) {
        result += `<code>${escapeJsxText(code.text)}</code>`;
        index = code.end;
        continue;
      }
    }

    if (char === '<') {
      const tag = readInlineJsxTag(value, index);
      if (tag) {
        result += tag.text;
        index = tag.end;
        continue;
      }

      result += renderPlainInlineChar(char);
      index++;
      continue;
    }

    if (char === '{') {
      const expression = readInlineMdxExpression(value, index);
      if (expression) {
        result += expression.text;
        index = expression.end;
        continue;
      }
    }

    const image = readInlineImage(value, index);
    if (image) {
      result += `<img src=${JSON.stringify(image.url)} alt=${JSON.stringify(
        image.alt,
      )}${image.title ? ` title=${JSON.stringify(image.title)}` : ''} />`;
      index = image.end;
      continue;
    }

    const link = readInlineLink(value, index);
    if (link) {
      result += `<a href=${JSON.stringify(link.url)}${
        link.title ? ` title=${JSON.stringify(link.title)}` : ''
      }>${renderInlineMarkdown(link.label)}</a>`;
      index = link.end;
      continue;
    }

    const strong = readDelimitedInline(value, index, '**', '__');
    if (strong) {
      result += `<strong>${renderInlineMarkdown(strong.text)}</strong>`;
      index = strong.end;
      continue;
    }

    const deleteText = readDelimitedInline(value, index, '~~');
    if (deleteText) {
      result += `<del>${renderInlineMarkdown(deleteText.text)}</del>`;
      index = deleteText.end;
      continue;
    }

    const emphasis = readDelimitedInline(value, index, '*', '_');
    if (emphasis) {
      result += `<em>${renderInlineMarkdown(emphasis.text)}</em>`;
      index = emphasis.end;
      continue;
    }

    result += renderPlainInlineChar(char);
    index++;
  }

  return result;
}

function renderPlainInlineChar(char: string) {
  switch (char) {
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '{':
      return '&#123;';
    case '}':
      return '&#125;';
    default:
      return char;
  }
}

function readInlineJsxTag(value: string, start: number) {
  if (value.startsWith('<!--', start)) {
    const end = value.indexOf('-->', start + 4);
    return end === -1
      ? null
      : { text: value.slice(start, end + 3), end: end + 3 };
  }

  const closingTag = /^<\/[A-Za-z][A-Za-z0-9:_-]*\s*>/.exec(
    value.slice(start),
  );
  if (closingTag) {
    return {
      text: closingTag[0],
      end: start + closingTag[0].length,
    };
  }

  if (!readTagName(value, start)) {
    return null;
  }

  const insertPosition = findOpeningTagInsertPosition(value, start);
  if (insertPosition === -1) {
    return null;
  }

  const end = value.indexOf('>', insertPosition);
  return { text: value.slice(start, end + 1), end: end + 1 };
}

function readInlineMdxExpression(value: string, start: number) {
  let quote = '';
  let comment: 'block' | '' = '';
  let regex = false;
  let regexCharClass = false;
  let depth = 0;

  for (let i = start; i < value.length; i++) {
    const char = value[i];
    const prev = value[i - 1];

    if (comment === 'block') {
      if (prev === '*' && char === '/') {
        comment = '';
      }
      continue;
    }

    if (regex) {
      if (char === '[' && prev !== '\\') {
        regexCharClass = true;
        continue;
      }

      if (char === ']' && prev !== '\\') {
        regexCharClass = false;
        continue;
      }

      if (char === '/' && prev !== '\\' && !regexCharClass) {
        regex = false;
      }
      continue;
    }

    if (quote) {
      if (char === quote && prev !== '\\') {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '/' && value[i + 1] === '/') {
      return null;
    }

    if (char === '/' && value[i + 1] === '*') {
      comment = 'block';
      i++;
      continue;
    }

    if (char === '/' && shouldStartInlineRegex(value, start, i)) {
      regex = true;
      regexCharClass = false;
      continue;
    }

    if (char === '{') {
      depth++;
      continue;
    }

    if (char === '}') {
      depth--;
      if (depth === 0) {
        return {
          text: value.slice(start, i + 1),
          end: i + 1,
        };
      }
    }
  }

  return null;
}

function shouldStartInlineRegex(value: string, expressionStart: number, index: number) {
  let cursor = index - 1;
  while (cursor > expressionStart && /\s/.test(value[cursor])) {
    cursor--;
  }

  if (cursor <= expressionStart) {
    return true;
  }

  const prev = value[cursor];
  if ('([{=,:;!?&|+-*~^<>'.includes(prev)) {
    return true;
  }

  const before = value.slice(expressionStart + 1, cursor + 1);
  return /(?:^|[^\w$])(?:return|throw|case|typeof|delete|void|in|of)\s*$/.test(
    before,
  );
}

function readInlineCode(value: string, start: number) {
  const marker = /^`+/.exec(value.slice(start))![0];
  const end = value.indexOf(marker, start + marker.length);
  if (end === -1) {
    return null;
  }

  return {
    text: value.slice(start + marker.length, end),
    end: end + marker.length,
  };
}

function readInlineImage(value: string, start: number) {
  if (value[start] !== '!' || value[start + 1] !== '[') {
    return null;
  }

  const link = readInlineLink(value, start + 1);
  if (!link) {
    return null;
  }

  return {
    alt: stripMarkdown(link.label),
    url: link.url,
    title: link.title,
    end: link.end,
  };
}

function readInlineLink(value: string, start: number) {
  if (value[start] !== '[') {
    return null;
  }

  const labelEnd = findClosingBracket(value, start);
  if (labelEnd === -1 || value[labelEnd + 1] !== '(') {
    return null;
  }

  const destination = readLinkDestination(value, labelEnd + 2);
  if (!destination) {
    return null;
  }

  return {
    label: value.slice(start + 1, labelEnd),
    url: destination.url,
    title: destination.title,
    end: destination.end,
  };
}

function readDelimitedInline(
  value: string,
  start: number,
  ...delimiters: string[]
) {
  const delimiter = delimiters.find((item) => value.startsWith(item, start));
  if (!delimiter) {
    return null;
  }

  const contentStart = start + delimiter.length;
  const end = value.indexOf(delimiter, contentStart);
  if (end === -1 || end === contentStart) {
    return null;
  }

  return {
    text: value.slice(contentStart, end),
    end: end + delimiter.length,
  };
}

function findClosingBracket(value: string, start: number) {
  let depth = 0;
  for (let i = start; i < value.length; i++) {
    if (value[i] === '\\') {
      i++;
      continue;
    }

    if (value[i] === '[') {
      depth++;
    } else if (value[i] === ']') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function readLinkDestination(value: string, start: number) {
  let quote = '';
  let url = '';
  let title = '';
  let isTitle = false;
  let parenDepth = 0;

  for (let i = start; i < value.length; i++) {
    const char = value[i];
    const prev = value[i - 1];

    if (char === '\\' && i + 1 < value.length) {
      if (isTitle) {
        title += value.slice(i, i + 2);
      } else {
        url += value.slice(i, i + 2);
      }
      i++;
      continue;
    }

    if (quote) {
      if (char === quote && prev !== '\\') {
        quote = '';
      } else {
        title += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      isTitle = true;
      continue;
    }

    if (!isTitle && char === '(') {
      parenDepth++;
      url += char;
      continue;
    }

    if (char === ')' && parenDepth > 0) {
      parenDepth--;
      url += char;
      continue;
    }

    if (char === ')') {
      return {
        url: url.trim(),
        title: title.trim(),
        end: i + 1,
      };
    }

    if (/\s/.test(char) && url.trim() && parenDepth === 0) {
      isTitle = true;
      continue;
    }

    if (isTitle) {
      title += char;
    } else {
      url += char;
    }
  }

  return null;
}

function stripMarkdown(value: string) {
  return value
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, '$1')
    .replace(/[*_`~]/g, '');
}

function escapeJsxText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

function getMdxEsmRanges(
  lines: MdxLine[],
  ignoredRanges: Range[],
  frontmatterEnd: number,
) {
  const ranges: Range[] = [];
  const state: ScannerState = { quote: '', depth: 0 };
  let start = -1;

  lines.forEach((line) => {
    if (
      line.start < frontmatterEnd ||
      isOffsetInRanges(line.start, ignoredRanges)
    ) {
      return;
    }

    if (start === -1) {
      if (!isMdxEsmStart(line.text)) {
        return;
      }

      start = line.start;
      state.quote = '';
      state.depth = 0;
    }

    updateJsScannerState(line.text, state);
    if (isMdxEsmComplete(line.text, state)) {
      ranges.push({ start, end: line.end });
      start = -1;
      state.quote = '';
      state.depth = 0;
    }
  });

  if (start !== -1) {
    const lastLine = lines[lines.length - 1];
    ranges.push({ start, end: lastLine ? lastLine.end : start });
  }

  return ranges;
}

function isMdxEsmStart(line: string) {
  return /^\s*(?:import|export)\s/.test(line);
}

function isMdxEsmComplete(line: string, state: ScannerState) {
  const trimmed = line.trim();
  return (
    !state.quote &&
    state.depth <= 0 &&
    !/(?:[=([{,:?]|\|\||&&|=>)\s*$/.test(trimmed)
  );
}

function updateJsScannerState(value: string, state: ScannerState) {
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    const prev = value[i - 1];

    if (state.quote) {
      if (char === state.quote && prev !== '\\') {
        state.quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      state.quote = char;
      continue;
    }

    if (char === '{' || char === '[' || char === '(') {
      state.depth++;
      continue;
    }

    if (char === '}' || char === ']' || char === ')') {
      state.depth--;
    }
  }
}
