import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';
import { parse as parseSvelte, walk } from 'svelte/compiler';

export function transformSvelte(content: string, filePath: string, escapeTags: EscapeTags) {
  const s = new MagicString(content);

  // svelte parse dosen't support ts or scss/less
  // so replace the content of <script></script> and <style></style> with space
  let replacedContent = content;
  const scriptRegex = /<script(?:\s+[a-zA-Z-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]*))?)?>[\s\S]*?<\/script>/gi;
  const styleRegex = /<style(?:\s+[a-zA-Z-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]*))?)?>[\s\S]*?<\/style>/gi;
  const scriptMatches = content.match(scriptRegex) || [];
  const styleMatches = content.match(styleRegex) || [];
  [...scriptMatches, ...styleMatches].forEach((match) => {
    replacedContent = replacedContent.replace(match, ' '.repeat(match.length));
  });

  const html = parseSvelte(replacedContent).html;

  walk(html as any, {
    enter(node: any) {
      if (
        node.type === 'Element' &&
        !isEscapeTags(escapeTags, node.name) &&
        !node?.attributes?.some((attr: any) => attr?.name === PathName)
      ) {
        const insertPosition = node.start + node.name.length + 1;
        const line = countLines(content, node.start) + 1;
        const column = node.start - content.lastIndexOf('\n', node.start);

        const addition = ` ${PathName}="${filePath}:${line}:${column}:${
          node.name
        }"${node.attributes.length ? ' ' : ''}`;
        s.prependLeft(insertPosition, addition);
      }
    },
  });

  return s.toString();
}

/**
 * Calculate the line number for a given character position in the source code
 * @param text - The source text
 * @param position - The character position
 * @returns The line number (0-based)
 */
function countLines(text: string, position: number): number {
  return text.slice(0, position).split('\n').length - 1;
}
