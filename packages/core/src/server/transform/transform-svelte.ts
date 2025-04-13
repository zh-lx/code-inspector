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

// 计算给定字符位置在源代码中的行数
function countLines(text: string, position: number) {
  let count = 0;
  for (let i = 0; i < position; i++) {
    if (text[i] === '\n') {
      count++;
    }
  }
  return count;
}