import MagicString from 'magic-string';
import { PathName } from '../../shared/constant';
import type { TemplateChildNode, NodeTransform } from '@vue/compiler-dom';
import { parse, transform } from '@vue/compiler-dom';

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

const VueElementType = 1;

export function transformVue(content: string, filePath: string) {
  const s = new MagicString(content);

  const ast = parse(content, {
    comments: true,
  });

  transform(ast, {
    nodeTransforms: [
      ((node: TemplateChildNode) => {
        if (
          !node.loc.source.includes(PathName) &&
          node.type === VueElementType &&
          escapeTags.indexOf(node.tag.toLowerCase()) === -1
        ) {
          // 向 dom 上添加一个带有 filepath/row/column 的属性
          const insertPosition = node.loc.start.offset + node.tag.length + 1;
          const { line, column } = node.loc.start;
          const addition = ` ${PathName}="${filePath}:${line}:${column}:${
            node.tag
          }"${node.props.length ? ' ' : ''}`;

          s.prependLeft(insertPosition, addition);
        }
      }) as NodeTransform,
    ],
  });

  return s.toString();
}
