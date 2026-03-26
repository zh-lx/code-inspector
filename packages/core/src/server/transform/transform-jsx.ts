import MagicString from 'magic-string';
import { PathName, EscapeTags, isEscapeTags } from '../../shared';
import vueJsxPlugin from '@vue/babel-plugin-jsx';
// @ts-expect-error - @babel/core doesn't provide TypeScript types
import { parse, traverse } from '@babel/core';
// @ts-expect-error - @babel/plugin-transform-typescript doesn't provide TypeScript types
import tsPlugin from '@babel/plugin-transform-typescript';
// @ts-expect-error - @babel/plugin-syntax-import-meta doesn't provide TypeScript types
import importMetaPlugin from '@babel/plugin-syntax-import-meta';
// @ts-expect-error - @babel/plugin-proposal-decorators doesn't provide TypeScript types
import proposalDecorators from '@babel/plugin-proposal-decorators';

function getJSXElementName(nameNode: any): string {
  if (!nameNode) return '';
  if (nameNode.type === 'JSXIdentifier') {
    return nameNode.name || '';
  }
  if (nameNode.type === 'JSXMemberExpression') {
    const objectName = getJSXElementName(nameNode.object);
    const propertyName = nameNode.property?.name || '';
    return objectName ? `${objectName}.${propertyName}` : propertyName;
  }
  if (nameNode.type === 'JSXNamespacedName') {
    // Use '.' instead of ':' to avoid breaking data-insp-path parsing
    // which uses ':' as its delimiter (filePath:line:column:tagName)
    return `${nameNode.namespace?.name || ''}.${nameNode.name?.name || ''}`;
  }
  return '';
}

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
      const nodeName = getJSXElementName(node?.openingElement?.name);
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
        const addition = ` ${PathName}="${filePath}:${line}:${
          column + 1
        }:${nodeName}"${node.openingElement.attributes.length ? ' ' : ''}`;

        s.prependLeft(insertPosition, addition);
      }
    },
  });

  return s.toString();
}
