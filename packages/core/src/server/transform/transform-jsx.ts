import MagicString from 'magic-string';
import { PathName, EscapeTags, isEscapeTags } from '../../shared';
import { getShortagePath } from '../server';
import vueJsxPlugin from '@vue/babel-plugin-jsx';
// @ts-ignore
import { parse, traverse } from '@babel/core';
// @ts-ignore
import tsPlugin from '@babel/plugin-transform-typescript';
// @ts-ignore
import importMetaPlugin from '@babel/plugin-syntax-import-meta';
// @ts-ignore
import proposalDecorators from '@babel/plugin-proposal-decorators';

export function transformJsx(content: string, filePath: string, escapeTags: EscapeTags) {
  const s = new MagicString(content);

  const ast = parse(content, {
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

  traverse(ast!, {
    enter({ node }: any) {
      const nodeName = node?.openingElement?.name?.name || '';
      const attributes = node?.openingElement?.attributes || [];
      if (
        node.type === 'JSXElement' &&
        nodeName &&
        !isEscapeTags(escapeTags, nodeName)
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
        const addition = ` ${PathName}="${getShortagePath(filePath)}:${line}:${
          column + 1
        }:${nodeName}"${node.openingElement.attributes.length ? ' ' : ''}`;

        s.prependLeft(insertPosition, addition);
      }
    },
  });

  return s.toString();
}
