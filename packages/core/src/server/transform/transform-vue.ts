import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';
import type {
  TemplateChildNode,
  NodeTransform,
  ElementNode,
} from '@vue/compiler-dom';
import { parse, transform } from '@vue/compiler-dom';
import { ProjectRootPath } from '../server';
import path from 'path';
import fs from 'fs';
import {
  isPugTemplate,
  transformPugTemplate,
  pugMap,
  calculateLineOffsets,
} from './transform-vue-pug';

const VueElementType = 1;

export function transformVue(
  content: string,
  filePath: string,
  escapeTags: EscapeTags
) {
  // 兼容 pug 热更新时逻辑
  let prefixSubstring = '', suffixSubstring = '';
  if (pugMap.has(filePath)) {
    try {
      const absolutePath =
        ProjectRootPath && !path.isAbsolute(filePath)
          ? `${ProjectRootPath}/${filePath}`
          : filePath;
      const completeContent = fs.readFileSync(absolutePath, 'utf-8');
      if (!content.includes(PathName)) {
        const contentIndex = completeContent.indexOf(content);
        prefixSubstring = completeContent.slice(0, contentIndex);
        suffixSubstring = completeContent.slice(contentIndex + content.length);
        content = completeContent;
      }
    } catch (_) {
      //
    }
  }

  const s = new MagicString(content);

  const ast = parse(content, {
    comments: true,
  });

  // 判断是否为 Pug 模版
  const templateNode = ast.children.find(
    (node) => node.type === VueElementType && node.tag === 'template'
  ) as ElementNode;

  // Check if template uses Pug
  if (isPugTemplate(templateNode)) {
    // Store line offsets for Pug processing
    const offsets = calculateLineOffsets(content);
    pugMap.set(filePath, { content, offsets });
  }

  // Transform based on template type
  if (pugMap.has(filePath) && templateNode) {
    transformPugTemplate(content, filePath, templateNode, escapeTags, s);
  } else {
    transformVueTemplate(ast, filePath, escapeTags, s);
  }

  let result = s.toString();
  return result.slice(prefixSubstring.length, result.length - suffixSubstring.length);
}

/**
 * Transform regular Vue template (non-Pug)
 * @param ast - The parsed Vue AST
 * @param filePath - The file path
 * @param escapeTags - Tags to escape from transformation
 * @param s - MagicString instance for code transformation
 */
function transformVueTemplate(
  ast: any,
  filePath: string,
  escapeTags: EscapeTags,
  s: MagicString
): void {
  transform(ast, {
    nodeTransforms: [
      ((node: TemplateChildNode) => {
        if (
          !node.loc.source.includes(PathName) &&
          node.type === VueElementType &&
          !isEscapeTags(escapeTags, node.tag)
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
}
