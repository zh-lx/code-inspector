import MagicString from 'magic-string';
import { PathName } from '../../shared/constant';
import vueJsxPlugin from '@vue/babel-plugin-jsx';
// @ts-ignore
import { parse as babelParse, traverse as babelTraverse } from '@babel/core';
// @ts-ignore
import tsPlugin from '@babel/plugin-transform-typescript';
// @ts-ignore
import importMetaPlugin from '@babel/plugin-syntax-import-meta';
// @ts-ignore
import proposalDecorators from '@babel/plugin-proposal-decorators';

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

export function enhanceJsx(content: string, filePath: string) {
  const s = new MagicString(content);

  const ast = babelParse(content, {
    babelrc: false,
    comments: true,
    configFile: false,
    plugins: [
      importMetaPlugin,
      [vueJsxPlugin, {}],
      [tsPlugin, { isTSX: true, allowExtensions: true }],
      [proposalDecorators, { legacy: true }],
    ],
  });

  babelTraverse(ast, {
    enter({ node }: any) {
      const nodeName = node?.openingElement?.name?.name || '';
      const attributes = node?.openingElement?.attributes || [];
      if (
        node.type === 'JSXElement' &&
        nodeName &&
        escapeTags.indexOf(nodeName.toLowerCase()) === -1
      ) {
        if (
          attributes.some(
            (attr: any) =>
              attr.type !== 'JSXSpreadAttribute' && attr.name?.name === PathName
          )
        ) {
          return;
        }

        // 向 dom 上添加一个带有 filepath/row/column 的属性
        const insertPosition =
          node.openingElement.end - (node.openingElement.selfClosing ? 2 : 1);
        const { line, column } = node.loc.start;
        const addition = ` ${PathName}="${filePath}:${line}:${
          column + 1
        }:${nodeName}"${node.openingElement.attributes.length ? ' ' : ''}`;

        s.prependLeft(insertPosition, addition);
      }
    },
  });

  return s.toString();
}
