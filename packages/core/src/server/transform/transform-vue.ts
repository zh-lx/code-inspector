import MagicString from 'magic-string';
import { EscapeTags, PathName, isEscapeTags } from '../../shared';
import type {
  TemplateChildNode,
  NodeTransform,
  ElementNode,
} from '@vue/compiler-dom';
import { parse, transform } from '@vue/compiler-dom';
import * as pug from 'volar-service-pug/lib/languageService';
import { ProjectRootPath } from '../server';
import path from 'path';
import fs from 'fs';

interface AstLocation {
  column: number;
  line: number;
}

interface PugFileInfo {
  content: string;
  offsets: number[];
}

const VueElementType = 1;
const AttributeNodeType = 6;
const pugMap = new Map<string, PugFileInfo>(); // 使用了 pug 模板的 vue 文件集合

function belongTemplate(
  target: AstLocation,
  start: AstLocation,
  end: AstLocation
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
  node: pug.Node;
  templateNode: ElementNode;
  s: MagicString;
  escapeTags: EscapeTags;
  filePath: string;
}

function transformPugAst(params: TransformPugParams) {
  const { node, templateNode, escapeTags, s, filePath } = params;
  if (!node) {
    return;
  }
  if (node.type === 'Block') {
    node.nodes.forEach((childNode) => {
      transformPugAst({ ...params, node: childNode });
    });
  } else if (node.type === 'Tag') {
    const nodeLocation = {
      line: node.line,
      column: (node as pug.TagNode).column,
    };
    const belongToTemplate = belongTemplate(
      nodeLocation,
      templateNode.loc.start,
      templateNode.loc.end
    );
    if (
      belongToTemplate &&
      !node.attrs.some((attr) => attr.name === PathName) &&
      !isEscapeTags(escapeTags, node.name)
    ) {
      // 向 dom 上添加一个带有 filepath/row/column 的属性
      const { offsets, content } = pugMap.get(filePath) as PugFileInfo;
      const offset = offsets[node.line - 1] + node.column - 1;
      let insertPosition = offset;
      // 以 node.name 开头
      if (node.name === content.slice(offset, offset + node.name.length)) {
        insertPosition += node.name.length;
      } else {
        for (let i = 0; i < node.attrs.length; i++) {
          const attr = node.attrs[i];
          if (['class', 'id'].includes(attr.name) && !attr.mustEscape) {
            insertPosition =
              offsets[attr.line - 1] + attr.column + attr.name.length;
          }
        }
      }
      if (content[insertPosition] === '(') {
        // 说明已有 attributes
        const addition = `${PathName}="${filePath}:${node.line}:${node.column}:${node.name}", `;
        s.prependLeft(insertPosition + 1, addition);
      } else {
        const addition = `(${PathName}="${filePath}:${node.line}:${node.column}:${node.name}")`;
        s.prependLeft(insertPosition, addition);
      }
    }
    transformPugAst({ ...params, node: node.block });
  }
}

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
  if (
    templateNode &&
    (templateNode.props || []).some(
      (prop) =>
        prop.type === AttributeNodeType &&
        prop.name === 'lang' &&
        prop.value?.content === 'pug'
    )
  ) {
    const lines = content.split('\n');
    const offsets = new Array(lines.length);
    offsets[0] = 0;
    for (let i = 1; i < offsets.length; i++) {
      offsets[i] = offsets[i - 1] + lines[i - 1].length + 1; // 1为\n的长度
    }
    pugMap.set(filePath, { content, offsets });
  }

  if (pugMap.has(filePath) && templateNode) {
    const tempContent =
      ' '.repeat(templateNode.loc.start.offset - 0) +
      content.slice(
        templateNode.loc.start.offset,
        templateNode.loc.end.offset
      ) +
      ' '.repeat(content.length - templateNode.loc.end.offset);
    const pugFile = pug.baseParse(tempContent);
    transformPugAst({
      node: pugFile.ast as pug.Node,
      filePath,
      s,
      escapeTags,
      templateNode,
    });
  } else {
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

  let result = s.toString();
  return s.toString().slice(prefixSubstring.length, result.length - suffixSubstring.length);
}
