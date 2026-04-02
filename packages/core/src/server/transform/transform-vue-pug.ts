import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';
import type { ElementNode } from '@vue/compiler-dom';
import * as pug from 'volar-service-pug/lib/languageService';

interface AstLocation {
  column: number;
  line: number;
}

export interface PugFileInfo {
  content: string;
  offsets: number[];
}

const AttributeNodeType = 6;
export const pugMap = new Map<string, PugFileInfo>(); // 使用了 pug 模板的 vue 文件集合

export function belongTemplate(
  target: AstLocation,
  start: AstLocation,
  end: AstLocation,
) {
  return (
    (target.line > start.line && target.line < end.line) ||
    (target.line === start.line &&
      (target.column >= start.column || target.column === undefined)) ||
    (target.line === end.line &&
      (target.column <= end.column || target.column === undefined))
  );
}

interface TransformPugParams {
  node: pug.Node | null | undefined;
  templateNode: ElementNode;
  s: MagicString;
  escapeTags: EscapeTags;
  filePath: string;
}

export function transformPugAst(params: TransformPugParams) {
  const { node, templateNode, escapeTags, s, filePath } = params;
  if (!node) {
    return;
  }
  if (node.type === 'Block') {
    node.nodes.forEach((childNode) => {
      transformPugAst({ ...params, node: childNode });
    });
  } else if (node.type === 'Tag') {
    const lineOffset = templateNode.loc.start.line - 1;
    const nodeLocation = {
      line: node.line + lineOffset,
      column: (node as pug.TagNode).column,
    };
    const belongToTemplate = belongTemplate(
      nodeLocation,
      templateNode.loc.start,
      templateNode.loc.end,
    );
    if (
      belongToTemplate &&
      !node.attrs.some((attr) => attr.name === PathName) &&
      !isEscapeTags(escapeTags, node.name)
    ) {
      // 向 dom 上添加一个带有 filepath/row/column 的属性
      const { offsets, content } = pugMap.get(filePath) as PugFileInfo;
      const offset = offsets[nodeLocation.line - 1] + nodeLocation.column - 1;
      let insertPosition = offset;
      // 以 node.name 开头
      if (node.name === content.slice(offset, offset + node.name.length)) {
        insertPosition += node.name.length;
      } else {
        for (let i = 0; i < node.attrs.length; i++) {
          const attr = node.attrs[i];
          if (['class', 'id'].includes(attr.name) && !attr.mustEscape) {
            insertPosition =
              offsets[attr.line + lineOffset - 1] +
              attr.column +
              // @ts-expect-error - attr.val is not typed
              (attr.val.length - 2);
          }
        }
      }
      if (content[insertPosition] === '(') {
        // 说明已有 attributes
        const addition = `${PathName}="${filePath}:${nodeLocation.line}:${nodeLocation.column}:${node.name}", `;
        s.prependLeft(insertPosition + 1, addition);
      } else {
        const addition = `(${PathName}="${filePath}:${nodeLocation.line}:${nodeLocation.column}:${node.name}")`;
        s.prependLeft(insertPosition, addition);
      }
    }
    transformPugAst({ ...params, node: node.block });
  } else if (['Case', 'Code', 'When', 'Each', 'While'].includes(node.type)) {
    if ((node as pug.MixinNode).block) {
      ((node as pug.MixinNode).block?.nodes || []).forEach((childNode) => {
        transformPugAst({ ...params, node: childNode });
      });
    }
    // @ts-expect-error - Pug Conditional type not exported
  } else if (node.type === 'Conditional') {
    // @ts-expect-error - Pug Conditional consequent/alternate properties not typed
    (node.consequent?.nodes || []).forEach((childNode) => {
      transformPugAst({ ...params, node: childNode });
    });
    // @ts-expect-error - Pug Conditional consequent/alternate properties not typed
    (node.alternate?.nodes || []).forEach((childNode) => {
      transformPugAst({ ...params, node: childNode });
    });
  }
}

/**
 * Check if a template node uses Pug syntax
 * @param templateNode - The template element node to check
 * @returns true if the template uses Pug, false otherwise
 */
export function isPugTemplate(templateNode: ElementNode | undefined): boolean {
  if (!templateNode) {
    return false;
  }
  return (templateNode.props || []).some(
    (prop) =>
      prop.type === AttributeNodeType &&
      prop.name === 'lang' &&
      prop.value?.content === 'pug',
  );
}

/**
 * Calculate line offsets for content
 * @param content - The file content
 * @returns Array of line offsets
 */
export function calculateLineOffsets(content: string): number[] {
  const lines = content.split('\n');
  const offsets = new Array(lines.length);
  offsets[0] = 0;
  for (let i = 1; i < offsets.length; i++) {
    offsets[i] = offsets[i - 1] + lines[i - 1].length + 1; // 1为\n的长度
  }
  return offsets;
}

/**
 * Transform Pug template in Vue SFC
 * @param content - The file content
 * @param filePath - The file path
 * @param templateNode - The template element node
 * @param escapeTags - Tags to escape from transformation
 * @param s - MagicString instance for code transformation
 */
export function transformPugTemplate(
  content: string,
  filePath: string,
  templateNode: ElementNode,
  escapeTags: EscapeTags,
  s: MagicString,
): void {
  // Calculate and store line offsets
  const offsets = calculateLineOffsets(content);
  pugMap.set(filePath, { content, offsets });

  // Create temporary content with template section preserved
  const tempContent =
    ' '.repeat(templateNode.loc.start.offset - 0) +
    content.slice(templateNode.loc.start.offset, templateNode.loc.end.offset) +
    ' '.repeat(content.length - templateNode.loc.end.offset);

  // Parse and transform Pug AST
  const pugFile = pug.baseParse(tempContent);
  transformPugAst({
    node: pugFile.ast as pug.Node,
    filePath,
    s,
    escapeTags,
    templateNode,
  });
}
