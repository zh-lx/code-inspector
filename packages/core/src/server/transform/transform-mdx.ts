import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';

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
};

export function transformMdx(
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

  listGroups.forEach((group) => {
    if (isEscapeTags(escapeTags, group.kind) || isEscapeTags(escapeTags, 'li')) {
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
      )}>${item.text}</li>`;

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

  lines.forEach((line) => {
    if (
      isOffsetInRanges(line.start, ignoredRanges) ||
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
        )}>${heading.text}</${heading.tag}>`,
      );
      rewrittenRanges.push({ start: line.start, end: line.end });
      return;
    }

    const blockquote = readBlockquote(line);
    if (
      blockquote &&
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
        )}>${blockquote.text}</p></blockquote>`,
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
      finishCurrent();
      return;
    }

    if (
      !current ||
      current.kind !== item.kind ||
      current.indent !== item.indent
    ) {
      finishCurrent();
      current = {
        kind: item.kind,
        indent: item.indent,
        items: [],
      };
    }

    current.items.push(item);
  });

  finishCurrent();
  return groups;
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
      shouldInjectTag(name, escapeTags) &&
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
    if (isEscapeTags(escapeTags, lowerName)) {
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
  const match = /^(\s*)(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line.text);
  if (!match) {
    return null;
  }

  return {
    tag: `h${match[2].length}`,
    column: match[1].length + 1,
    text: match[3],
  };
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

  return ranges;
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

function shouldInjectTag(name: string, escapeTags: EscapeTags) {
  return name[0] === name[0].toLowerCase() && !isEscapeTags(escapeTags, name);
}

function hasPathAttributeInSource(openingTag: string) {
  return new RegExp(`\\s${PathName}(?:\\s|=|$)`).test(openingTag);
}

function getMdxPathAttribute(
  filePath: string,
  line: number,
  column: number,
  name: string,
) {
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
