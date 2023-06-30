import MagicString from 'magic-string';
import { PathName } from '../shared/constant';
import type { TemplateChildNode, NodeTransform } from '@vue/compiler-dom';
import { parse, transform } from '@vue/compiler-dom';
import vueJsxPlugin from '@vue/babel-plugin-jsx';
// @ts-ignore
import { parse as babelParse, traverse as babelTraverse } from '@babel/core';
// @ts-ignore
import tsPlugin from '@babel/plugin-transform-typescript';
// @ts-ignore
import importMetaPlugin from '@babel/plugin-syntax-import-meta';

type FileType = 'vue' | 'vue-jsx';

export function getEnhanceContent(
  content: string,
  filePath: string,
  fileType: FileType = 'vue'
) {
  try {
    const s = new MagicString(content);
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
    ];

    if (fileType === 'vue') {
      const ast = parse(content, {
        comments: true,
      });

      transform(ast, {
        nodeTransforms: [
          ((node: TemplateChildNode) => {
            if (
              !node.loc.source.includes(PathName) &&
              node.type === 1 &&
              escapeTags.indexOf(node.tag.toLowerCase()) === -1
            ) {
              const insertPosition =
                node.loc.start.offset + node.tag.length + 1;
              const { line, column } = node.loc.start;
              const content = ` ${PathName}="${filePath}:${line}:${column}:${
                node.tag
              }"${node.props.length ? ' ' : ''}`;

              s.prependLeft(insertPosition, content);
            }
          }) as NodeTransform,
        ],
      });
    } else if (fileType === 'vue-jsx') {
      const ast = babelParse(content, {
        babelrc: false,
        comments: true,
        configFile: false,
        plugins: [
          importMetaPlugin,
          [vueJsxPlugin, {}],
          [tsPlugin, { isTSX: true, allowExtensions: true }],
        ],
      });

      babelTraverse(ast, {
        enter({ node }: any) {
          if (
            node.type === 'JSXElement' &&
            escapeTags.indexOf(
              (node?.openingElement?.name?.name || '').toLowerCase()
            ) === -1
          ) {
            if (
              node.openingElement.attributes.some(
                (attr: any) =>
                  attr.type !== 'JSXSpreadAttribute' &&
                  attr.name.name === PathName
              )
            ) {
              return;
            }

            const insertPosition =
              node.openingElement.end -
              (node.openingElement.selfClosing ? 2 : 1);
            const { line, column } = node.loc.start;

            const content = ` ${PathName}="${filePath}:${line}:${column}:${
              node.openingElement.name.name
            }"${node.openingElement.attributes.length ? ' ' : ''}`;

            s.prependLeft(insertPosition, content);
          }
        },
      });
    }

    return s.toString();
  } catch (error) {
    console.error(
      'Webpack Code Inspector Plugin: failed to compile ' + filePath
    );
    return content;
  }
}
