import MagicString from 'magic-string';
import { PathName } from '../../shared/constant';
import { parse as parseSvelte, walk } from 'svelte/compiler';

const escapeTags = [
  'style',
  'script',
  'template',
  'transition',
  'keepalive',
  'keep-alive',
  'component',
  'slot',
  'teleport',
  'transition-group',
  'transitiongroup',
  'suspense',
  'fragment',
];

export function enhanceSvelte(content: string, filePath: string) {
  const s = new MagicString(content);

  const html = parseSvelte(content).html;

  walk(html as any, {
    enter(node: any) {
      if (
        node.type === 'Element' &&
        escapeTags.indexOf(node.name.toLowerCase()) === -1 &&
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