import MagicString from 'magic-string';
import { transform, parse } from '@vue/compiler-dom';
import { PathName } from '../shared/constant';

export async function getEnhanceContent(content: string, filePath: string) {
  const s = new MagicString(content);
  const ast = parse(content, {
    comments: true,
  });
  transform(ast, {
    nodeTransforms: [
      (node) => {
        if (
          !node.loc.source.includes(PathName) &&
          node.type === 1 &&
          node.tagType === 0
        ) {
          const insertPosition = node.loc.start.offset + node.tag.length + 1;
          const { line, column } = node.loc.start;
          const content = ` ${PathName}="${filePath}:${line}:${column}"${
            node.props.length ? ' ' : ''
          }`;

          s.prependLeft(insertPosition, content);
        }
      },
    ],
  });
  return s.toString();
}
