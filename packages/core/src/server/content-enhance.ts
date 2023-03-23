import MagicString from 'magic-string';
import { PathName } from '../shared/constant';
import { type TemplateChildNode } from '@vue/compiler-dom';
const { parse: babelParse, traverse: babelTraverse } = require('@babel/core');
const { parse, transform } = require('@vue/compiler-dom');
const vueJsxPlugin = require('@vue/babel-plugin-jsx');
const tsPlugin = require('@babel/plugin-transform-typescript');
const importMetaPlugin = require('@babel/plugin-syntax-import-meta');

type FileType = 'vue' | 'vue-jsx';

export function getEnhanceContent(
  content: string,
  filePath: string,
  fileType: FileType = 'vue'
) {
  const s = new MagicString(content);
  const escapeTags = ['style', 'script', 'template'];

  if (fileType === 'vue') {
    const ast = parse(content, {
      comments: true,
    });

    transform(ast, {
      nodeTransforms: [
        (node: TemplateChildNode) => {
          if (
            !node.loc.source.includes(PathName) &&
            node.type === 1 &&
            escapeTags.indexOf(node.tag) === -1
          ) {
            const insertPosition = node.loc.start.offset + node.tag.length + 1;
            const { line, column } = node.loc.start;
            const content = ` ${PathName}="${filePath}:${line}:${column}:${
              node.tag
            }"${node.props.length ? ' ' : ''}`;

            s.prependLeft(insertPosition, content);
          }
        },
      ],
    });
  } else if (fileType === 'vue-jsx') {
    const ast = babelParse(content, {
      babelrc: false,
      comments: true,
      plugins: [
        importMetaPlugin,
        [vueJsxPlugin, {}],
        [tsPlugin, { isTSX: true, allowExtensions: true }],
      ],
    });

    babelTraverse(ast, {
      enter({ node }: any) {
        if (node.type === 'JSXElement') {
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
            node.openingElement.end - (node.openingElement.selfClosing ? 2 : 1);
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
}
