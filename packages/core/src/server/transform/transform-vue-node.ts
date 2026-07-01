import type {
  AttributeNode,
  ElementNode,
  NodeTransform,
  SourceLocation,
  TemplateChildNode,
  TextNode,
  TransformContext,
} from '@vue/compiler-dom';
import { NodeTypes } from '@vue/compiler-dom';
import type { EscapeTags, PathType } from '../../shared';
import {
  CodeInspectorEscapeTags,
  PathName,
  getMappingFilePath,
  isEscapeTags,
  normalizePath,
} from '../../shared';
import { getRelativeOrAbsolutePath } from '../server';

type VueInspectorNodeTransformOptions = {
  escapeTags?: EscapeTags;
  pathType?: PathType;
  mappings?:
    | Record<string, string>
    | Array<{ find: string | RegExp; replacement: string }>;
};

function hasInspectorPath(node: ElementNode) {
  return node.props.some(
    (prop) => prop.type === NodeTypes.ATTRIBUTE && prop.name === PathName,
  );
}

function createTextNode(content: string, loc: SourceLocation): TextNode {
  return {
    type: NodeTypes.TEXT,
    content,
    loc,
  } as TextNode;
}

function createAttributeNode(
  name: string,
  content: string,
  loc: SourceLocation,
): AttributeNode {
  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    nameLoc: loc,
    value: createTextNode(content, loc),
    loc,
  } as AttributeNode;
}

function getNodeFilePath(
  context: TransformContext,
  options: VueInspectorNodeTransformOptions,
) {
  if (!context.filename) {
    return '';
  }

  const filename = normalizePath(context.filename);
  const mappedFilePath = getMappingFilePath(filename, options.mappings);
  return getRelativeOrAbsolutePath(
    mappedFilePath,
    options.pathType ?? 'relative',
  );
}

export function createVueInspectorNodeTransform(
  options: VueInspectorNodeTransformOptions = {},
): NodeTransform {
  const finalEscapeTags = [
    ...CodeInspectorEscapeTags,
    ...(options.escapeTags || []),
  ];

  return ((node: TemplateChildNode, context: TransformContext) => {
    if (
      node.type !== NodeTypes.ELEMENT ||
      hasInspectorPath(node) ||
      isEscapeTags(finalEscapeTags, node.tag)
    ) {
      return;
    }

    const { line, column } = node.loc.start;
    const filePath = getNodeFilePath(context, options);
    if (!filePath) {
      return;
    }

    node.props.unshift(
      createAttributeNode(
        PathName,
        `${filePath}:${line}:${column}:${node.tag}`,
        node.loc,
      ),
    );
  }) as NodeTransform;
}
