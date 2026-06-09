import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';

type AstroCompiler = {
  parse: (
    content: string,
    options?: { position?: boolean },
  ) => Promise<{ ast?: AstroNode; diagnostics?: unknown[] }>;
};

type AstroNode = {
  type: string;
  name?: string;
  attributes?: Array<{ name?: string }>;
  children?: AstroNode[];
  position?: {
    start?: {
      line?: number;
      column?: number;
      offset?: number;
    };
  };
};

const compilerCache = new Map<string, AstroCompiler | null>();

export async function transformAstro(
  content: string,
  filePath: string,
  escapeTags: EscapeTags,
) {
  const compiler = resolveAstroCompiler(filePath);
  if (!compiler) {
    return transformAstroByScan(content, filePath, escapeTags);
  }

  try {
    const result = await compiler.parse(content, { position: true });
    if (!result.ast) {
      return transformAstroByScan(content, filePath, escapeTags);
    }

    const s = new MagicString(content);
    walkAstroNodes(result.ast, (node) => {
      injectAstroNodePath(content, s, node, filePath, escapeTags);
    });
    return s.toString();
  } catch (error) {
    return transformAstroByScan(content, filePath, escapeTags);
  }
}

function resolveAstroCompiler(filePath: string): AstroCompiler | null {
  const resolveDir = fs.existsSync(filePath) ? path.dirname(filePath) : filePath;
  if (compilerCache.has(resolveDir)) {
    return compilerCache.get(resolveDir) || null;
  }

  try {
    const requireFromFile = createRequire(path.join(resolveDir, 'noop.js'));
    const astroPackageJsonPath = fs.realpathSync(
      requireFromFile.resolve('astro/package.json'),
    );
    const requireFromAstro = createRequire(astroPackageJsonPath);
    const compilerPath = requireFromAstro.resolve('@astrojs/compiler');
    const compiler = requireFromAstro(compilerPath) as AstroCompiler;
    compilerCache.set(resolveDir, compiler);
    return compiler;
  } catch (error) {
    compilerCache.set(resolveDir, null);
    return null;
  }
}

function walkAstroNodes(node: AstroNode, callback: (node: AstroNode) => void) {
  callback(node);
  node.children?.forEach((child) => walkAstroNodes(child, callback));
}

function injectAstroNodePath(
  content: string,
  s: MagicString,
  node: AstroNode,
  filePath: string,
  escapeTags: EscapeTags,
) {
  if (!isInjectableAstroNode(node, escapeTags) || hasPathAttribute(node)) {
    return;
  }

  const start = node.position?.start;
  if (
    typeof start?.offset !== 'number' ||
    typeof start.line !== 'number' ||
    typeof start.column !== 'number' ||
    !node.name
  ) {
    return;
  }

  const insertPosition = findOpeningTagInsertPosition(content, start.offset);
  if (insertPosition === -1) {
    return;
  }

  s.prependLeft(
    insertPosition,
    getAstroPathAttribute(filePath, start.line, start.column, node.name),
  );
}

function isInjectableAstroNode(node: AstroNode, escapeTags: EscapeTags) {
  if (
    node.type !== 'element' &&
    node.type !== 'custom-element'
  ) {
    return false;
  }
  return Boolean(node.name && !isEscapeTags(escapeTags, node.name));
}

function hasPathAttribute(node: AstroNode) {
  return node.attributes?.some((attr) => attr.name === PathName);
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

function getAstroPathAttribute(
  filePath: string,
  line: number,
  column: number,
  name: string,
) {
  return ` ${PathName}=${JSON.stringify(
    `${filePath}:${line}:${column}:${name}`,
  )}`;
}

function transformAstroByScan(
  content: string,
  filePath: string,
  escapeTags: EscapeTags,
) {
  const s = new MagicString(content);
  const lineStarts = getLineStarts(content);
  let index = getFrontmatterEndOffset(content);

  while (index < content.length) {
    const tagStart = content.indexOf('<', index);
    if (tagStart === -1) {
      break;
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
      shouldInjectScannedTag(name, escapeTags) &&
      !hasPathAttributeInSource(content.slice(tagStart, insertPosition))
    ) {
      const position = getLineColumn(lineStarts, tagStart);
      s.prependLeft(
        insertPosition,
        getAstroPathAttribute(filePath, position.line, position.column, name),
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

  return s.toString();
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

function shouldInjectScannedTag(name: string, escapeTags: EscapeTags) {
  return name[0] === name[0].toLowerCase() && !isEscapeTags(escapeTags, name);
}

function hasPathAttributeInSource(openingTag: string) {
  return new RegExp(`\\s${PathName}(?:\\s|=|$)`).test(openingTag);
}

function getFrontmatterEndOffset(content: string) {
  if (!content.startsWith('---')) {
    return 0;
  }

  const match = /\n---(?:\r?\n|$)/.exec(content.slice(3));
  return match ? 3 + match.index + match[0].length : 0;
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
