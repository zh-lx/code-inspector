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

const PropagatedPathBinding = '__codeInspectorPath';
const ImplicitPropsBinding = '__codeInspectorProps';
type RootTarget =
  | { type: 'jsx'; node: any }
  | { type: 'createElement'; node: any };

export function transformJsx(
  content: string,
  filePath: string,
  escapeTags: EscapeTags,
) {
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

  const dynamicInjectedElements = new Set<number>();
  const dynamicInjectedCreateElementCalls = new Set<number>();

  traverse(ast!, {
    FunctionDeclaration(path: any) {
      transformComponentFunction(
        path,
        s,
        content,
        filePath,
        dynamicInjectedElements,
        dynamicInjectedCreateElementCalls,
        escapeTags,
      );
    },
    FunctionExpression(path: any) {
      transformComponentFunction(
        path,
        s,
        content,
        filePath,
        dynamicInjectedElements,
        dynamicInjectedCreateElementCalls,
        escapeTags,
      );
    },
    ArrowFunctionExpression(path: any) {
      transformComponentFunction(
        path,
        s,
        content,
        filePath,
        dynamicInjectedElements,
        dynamicInjectedCreateElementCalls,
        escapeTags,
      );
    },
    ClassDeclaration(path: any) {
      transformClassComponent(
        path,
        s,
        content,
        filePath,
        dynamicInjectedElements,
        dynamicInjectedCreateElementCalls,
        escapeTags,
      );
    },
    ClassExpression(path: any) {
      transformClassComponent(
        path,
        s,
        content,
        filePath,
        dynamicInjectedElements,
        dynamicInjectedCreateElementCalls,
        escapeTags,
      );
    },
    enter({ node }: any) {
      const openingElement = node.openingElement;
      const nodeName = getJsxNodeName(openingElement?.name);
      const attributes = openingElement?.attributes || [];
      if (
        node.type === 'JSXElement' &&
        nodeName &&
        !isEscapedJsxTag(escapeTags, nodeName)
      ) {
        if (
          dynamicInjectedElements.has(openingElement.start) ||
          hasPathAttribute(attributes)
        ) {
          return;
        }

        // 向 dom 上添加一个带有 filepath/row/column 的属性
        const insertPosition =
          openingElement.end - (openingElement.selfClosing ? 2 : 1);
        const addition = ` ${PathName}=${JSON.stringify(
          getNodePathValue(filePath, node, nodeName),
        )}${openingElement.attributes.length ? ' ' : ''}`;

        s.prependLeft(insertPosition, addition);
        return;
      }

      if (node.type === 'CallExpression') {
        injectStaticCreateElementPath(
          node,
          s,
          content,
          filePath,
          dynamicInjectedCreateElementCalls,
          escapeTags,
        );
      }
    },
  });

  return s.toString();
}

function transformComponentFunction(
  path: any,
  s: MagicString,
  content: string,
  filePath: string,
  dynamicInjectedElements: Set<number>,
  dynamicInjectedCreateElementCalls: Set<number>,
  escapeTags: EscapeTags,
) {
  if (!isComponentFunction(path)) {
    return;
  }

  // React 不会像 Vue 一样把组件调用点上的 attrs 自动透传到根 DOM，
  // 这里改写组件根节点，让它优先读取 props[data-insp-path]。
  const propExpression = getPropagatedPathExpression(path, s, content);
  if (!propExpression) {
    return;
  }

  const injectRootExpression = (expression: any, scope: any) => {
    if (!shouldPropagatePathToExpression(expression, scope)) {
      return;
    }

    injectRootTargets(
      collectRootTargets(expression, scope),
      s,
      content,
      filePath,
      dynamicInjectedElements,
      dynamicInjectedCreateElementCalls,
      propExpression,
      escapeTags,
    );
  };

  if (path.node.body?.type !== 'BlockStatement') {
    injectRootExpression(path.node.body, path.scope);
    return;
  }

  path.traverse({
    Function(innerPath: any) {
      if (innerPath.node !== path.node) {
        innerPath.skip();
      }
    },
    Class(innerPath: any) {
      innerPath.skip();
    },
    ReturnStatement(returnPath: any) {
      injectRootExpression(returnPath.node.argument, returnPath.scope);
    },
  });
}

function isComponentFunction(path: any) {
  const functionOwnerName = getComponentOwnerName(path);
  if (functionOwnerName) {
    return /^[A-Z]/.test(functionOwnerName);
  }

  return hasExportDefaultAncestor(path) && containsRenderableReturn(path);
}

function transformClassComponent(
  path: any,
  s: MagicString,
  content: string,
  filePath: string,
  dynamicInjectedElements: Set<number>,
  dynamicInjectedCreateElementCalls: Set<number>,
  escapeTags: EscapeTags,
) {
  if (!isComponentClass(path)) {
    return;
  }

  const renderMethodPaths = getRenderMethodPaths(path);
  const propExpression = `this.props && this.props[${JSON.stringify(PathName)}]`;
  const injectRootExpression = (expression: any, scope: any) => {
    if (!shouldPropagatePathToExpression(expression, scope)) {
      return;
    }

    injectRootTargets(
      collectRootTargets(expression, scope),
      s,
      content,
      filePath,
      dynamicInjectedElements,
      dynamicInjectedCreateElementCalls,
      propExpression,
      escapeTags,
    );
  };

  for (const renderMethodPath of renderMethodPaths) {
    renderMethodPath.traverse({
      Function(innerPath: any) {
        if (innerPath.node !== renderMethodPath.node) {
          innerPath.skip();
        }
      },
      Class(innerPath: any) {
        innerPath.skip();
      },
      ReturnStatement(returnPath: any) {
        injectRootExpression(returnPath.node.argument, returnPath.scope);
      },
    });
  }
}

function isComponentClass(path: any) {
  const renderMethodPaths = getRenderMethodPaths(path);
  if (!path.node.superClass || renderMethodPaths.length === 0) {
    return false;
  }

  const classOwnerName = getComponentOwnerName(path);
  if (classOwnerName) {
    return /^[A-Z]/.test(classOwnerName);
  }

  return (
    hasExportDefaultAncestor(path) &&
    renderMethodPaths.some((renderMethodPath: any) =>
      containsMethodRenderableReturn(renderMethodPath),
    )
  );
}

function getComponentOwnerName(path: any) {
  if (path.node.id?.type === 'Identifier') {
    return path.node.id.name;
  }

  let currentPath = path.parentPath;
  while (currentPath) {
    if (
      currentPath.isVariableDeclarator?.() &&
      currentPath.node.id?.type === 'Identifier'
    ) {
      return currentPath.node.id.name;
    }

    if (
      currentPath.isAssignmentExpression?.() &&
      currentPath.node.left?.type === 'Identifier'
    ) {
      return currentPath.node.left.name;
    }

    if (
      currentPath.isClass?.() ||
      currentPath.isFunction?.() ||
      currentPath.isObjectMethod?.()
    ) {
      break;
    }

    currentPath = currentPath.parentPath;
  }

  return '';
}

function hasExportDefaultAncestor(path: any) {
  let currentPath = path.parentPath;
  while (currentPath) {
    if (currentPath.isExportDefaultDeclaration?.()) {
      return true;
    }

    if (
      currentPath.isClass?.() ||
      currentPath.isFunction?.() ||
      currentPath.isObjectMethod?.()
    ) {
      return false;
    }

    currentPath = currentPath.parentPath;
  }

  return false;
}

function containsRenderableReturn(path: any): boolean {
  let hasRenderableReturn = false;
  const injectibleBody = path.node.body;
  if (injectibleBody?.type !== 'BlockStatement') {
    return collectRootTargets(injectibleBody, path.scope).length > 0;
  }

  path.traverse({
    Function(innerPath: any) {
      if (innerPath.node !== path.node) {
        innerPath.skip();
      }
    },
    Class(innerPath: any) {
      innerPath.skip();
    },
    ReturnStatement(returnPath: any) {
      if (
        collectRootTargets(returnPath.node.argument, returnPath.scope).length >
        0
      ) {
        hasRenderableReturn = true;
        returnPath.stop();
      }
    },
  });

  return hasRenderableReturn;
}

function getRenderMethodPaths(path: any) {
  return path
    .get('body.body')
    .filter(
      (memberPath: any) =>
        memberPath.node?.type === 'ClassMethod' &&
        getObjectPropertyName(memberPath.node.key) === 'render',
    );
}

function containsMethodRenderableReturn(path: any): boolean {
  let hasRenderableReturn = false;

  path.traverse({
    Function(innerPath: any) {
      if (innerPath.node !== path.node) {
        innerPath.skip();
      }
    },
    Class(innerPath: any) {
      innerPath.skip();
    },
    ReturnStatement(returnPath: any) {
      if (
        collectRootTargets(returnPath.node.argument, returnPath.scope).length >
        0
      ) {
        hasRenderableReturn = true;
        returnPath.stop();
      }
    },
  });

  return hasRenderableReturn;
}

function getPropagatedPathExpression(
  path: any,
  s: MagicString,
  content: string,
) {
  const firstParam = path.node.params?.[0];
  if (!firstParam) {
    // 无参组件需要补一个隐式 props 形参，才能读取调用点传进来的路径。
    const insertPosition = getEmptyParamsInsertPosition(path.node, content);
    if (insertPosition == null) {
      return '';
    }
    s.prependLeft(insertPosition, ImplicitPropsBinding);
    return `${ImplicitPropsBinding} && ${ImplicitPropsBinding}[${JSON.stringify(PathName)}]`;
  }

  return getParameterPathExpression(firstParam, s);
}

function getParameterPathExpression(param: any, s: MagicString): string {
  if (param.type === 'Identifier') {
    return `${param.name} && ${param.name}[${JSON.stringify(PathName)}]`;
  }

  if (param.type === 'AssignmentPattern') {
    return getParameterPathExpression(param.left, s);
  }

  if (param.type === 'ObjectPattern') {
    const existingBinding = getObjectPatternPathBinding(param);
    if (existingBinding) {
      return existingBinding;
    }

    // 解构 props 时补出 data-insp-path，尽量不改变用户原有写法。
    s.prependLeft(
      param.start + 1,
      `${JSON.stringify(PathName)}: ${PropagatedPathBinding}${
        param.properties.length ? ', ' : ''
      }`,
    );
    return PropagatedPathBinding;
  }

  return '';
}

function getObjectPatternPathBinding(param: any): string {
  for (const property of param.properties || []) {
    if (
      property?.type === 'ObjectProperty' &&
      getObjectPropertyName(property.key) === PathName
    ) {
      if (property.value?.type === 'Identifier') {
        return property.value.name;
      }

      if (
        property.value?.type === 'AssignmentPattern' &&
        property.value.left?.type === 'Identifier'
      ) {
        return property.value.left.name;
      }
    }
  }

  return '';
}

function getObjectPropertyName(node: any): string {
  if (!node) {
    return '';
  }

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'StringLiteral') {
    return node.value;
  }

  return '';
}

function getEmptyParamsInsertPosition(node: any, content: string) {
  const bodyStart = node.body?.start;
  if (typeof node.start !== 'number' || typeof bodyStart !== 'number') {
    return null;
  }

  const header = content.slice(node.start, bodyStart);
  const closeParenOffset = header.lastIndexOf(')');
  if (closeParenOffset === -1) {
    return null;
  }

  return node.start + closeParenOffset;
}

function injectRootTargets(
  rootTargets: RootTarget[],
  s: MagicString,
  content: string,
  filePath: string,
  dynamicInjectedElements: Set<number>,
  dynamicInjectedCreateElementCalls: Set<number>,
  propExpression: string,
  escapeTags: EscapeTags,
) {
  for (const rootTarget of rootTargets) {
    if (rootTarget.type === 'jsx') {
      injectDynamicPathAttribute(
        rootTarget.node,
        s,
        filePath,
        dynamicInjectedElements,
        propExpression,
        escapeTags,
      );
      continue;
    }

    injectDynamicCreateElementPath(
      rootTarget.node,
      s,
      content,
      filePath,
      dynamicInjectedCreateElementCalls,
      propExpression,
      escapeTags,
    );
  }
}

function collectRootTargets(
  node: any,
  scope: any,
  visitedBindings = new Set<string>(),
): RootTarget[] {
  if (!node) {
    return [];
  }

  const unwrappedNode = unwrapRenderableExpression(node);
  if (unwrappedNode !== node) {
    return collectRootTargets(unwrappedNode, scope, visitedBindings);
  }

  if (unwrappedNode.type === 'JSXElement') {
    return [{ type: 'jsx', node: unwrappedNode }];
  }

  if (unwrappedNode.type === 'CallExpression') {
    if (isCreatePortalCall(unwrappedNode)) {
      return collectRootTargets(
        unwrappedNode.arguments?.[0],
        scope,
        visitedBindings,
      );
    }

    if (isCreateElementCall(unwrappedNode)) {
      return [{ type: 'createElement', node: unwrappedNode }];
    }
  }

  if (unwrappedNode.type === 'Identifier') {
    return collectIdentifierRootTargets(unwrappedNode, scope, visitedBindings);
  }

  if (unwrappedNode.type === 'ConditionalExpression') {
    return [
      ...collectRootTargets(unwrappedNode.consequent, scope, visitedBindings),
      ...collectRootTargets(unwrappedNode.alternate, scope, visitedBindings),
    ];
  }

  if (unwrappedNode.type === 'LogicalExpression') {
    return [
      ...collectRootTargets(unwrappedNode.left, scope, visitedBindings),
      ...collectRootTargets(unwrappedNode.right, scope, visitedBindings),
    ];
  }

  if (unwrappedNode.type === 'SequenceExpression') {
    return collectRootTargets(
      unwrappedNode.expressions[unwrappedNode.expressions.length - 1],
      scope,
      visitedBindings,
    );
  }

  if (unwrappedNode.type === 'ArrayExpression') {
    return unwrappedNode.elements.flatMap((element: any) => {
      if (!element) {
        return [];
      }

      if (element.type === 'SpreadElement') {
        return collectRootTargets(element.argument, scope, visitedBindings);
      }

      return collectRootTargets(element, scope, visitedBindings);
    });
  }

  if (unwrappedNode.type === 'JSXFragment') {
    // Fragment 本身不会落到 DOM，上层路径需要下发给它的直接根子节点。
    return unwrappedNode.children.flatMap((child: any) => {
      if (child.type === 'JSXElement') {
        return [{ type: 'jsx', node: child }];
      }
      if (child.type === 'JSXFragment') {
        return collectRootTargets(child, scope, visitedBindings);
      }
      if (child.type === 'JSXExpressionContainer') {
        return collectRootTargets(child.expression, scope, visitedBindings);
      }
      return [];
    });
  }

  return [];
}

function unwrapRenderableExpression(node: any) {
  if (
    node?.type === 'ParenthesizedExpression' ||
    node?.type === 'TSAsExpression' ||
    node?.type === 'TSTypeAssertion' ||
    node?.type === 'TSNonNullExpression' ||
    node?.type === 'TypeCastExpression'
  ) {
    return node.expression;
  }

  return node;
}

function shouldPropagatePathToExpression(
  node: any,
  scope: any,
  visitedBindings = new Set<string>(),
): boolean {
  return estimateRootCount(node, scope, visitedBindings) <= 1;
}

function estimateRootCount(
  node: any,
  scope: any,
  visitedBindings: Set<string>,
): number {
  if (!node) {
    return 0;
  }

  const unwrappedNode = unwrapRenderableExpression(node);
  if (unwrappedNode !== node) {
    return estimateRootCount(unwrappedNode, scope, visitedBindings);
  }

  if (unwrappedNode.type === 'JSXElement') {
    return 1;
  }

  if (unwrappedNode.type === 'CallExpression') {
    if (isCreatePortalCall(unwrappedNode)) {
      return estimateRootCount(
        unwrappedNode.arguments?.[0],
        scope,
        visitedBindings,
      );
    }

    if (isCreateElementCall(unwrappedNode)) {
      return 1;
    }

    return 0;
  }

  if (unwrappedNode.type === 'Identifier') {
    return estimateIdentifierRootCount(unwrappedNode, scope, visitedBindings);
  }

  if (unwrappedNode.type === 'ConditionalExpression') {
    return Math.max(
      estimateRootCount(unwrappedNode.consequent, scope, visitedBindings),
      estimateRootCount(unwrappedNode.alternate, scope, visitedBindings),
    );
  }

  if (unwrappedNode.type === 'LogicalExpression') {
    return Math.max(
      estimateRootCount(unwrappedNode.left, scope, visitedBindings),
      estimateRootCount(unwrappedNode.right, scope, visitedBindings),
    );
  }

  if (unwrappedNode.type === 'SequenceExpression') {
    return estimateRootCount(
      unwrappedNode.expressions[unwrappedNode.expressions.length - 1],
      scope,
      visitedBindings,
    );
  }

  if (unwrappedNode.type === 'ArrayExpression') {
    let total = 0;

    for (const element of unwrappedNode.elements || []) {
      if (!element) {
        continue;
      }

      const childNode =
        element.type === 'SpreadElement' ? element.argument : element;
      total += estimateRootCount(childNode, scope, visitedBindings);
      if (total > 1) {
        return 2;
      }
    }

    return total;
  }

  if (unwrappedNode.type === 'JSXFragment') {
    let total = 0;

    for (const child of unwrappedNode.children || []) {
      if (child.type === 'JSXElement' || child.type === 'JSXFragment') {
        total += estimateRootCount(child, scope, visitedBindings);
      } else if (child.type === 'JSXExpressionContainer') {
        total += estimateRootCount(child.expression, scope, visitedBindings);
      }

      if (total > 1) {
        return 2;
      }
    }

    return total;
  }

  return 0;
}

function estimateIdentifierRootCount(
  node: any,
  scope: any,
  visitedBindings: Set<string>,
): number {
  if (!scope || node.name === 'undefined') {
    return 0;
  }

  const binding = scope.getBinding?.(node.name);
  if (!binding) {
    return 0;
  }

  const bindingKey = `${binding.identifier?.start ?? ''}:${binding.identifier?.name ?? ''}`;
  if (visitedBindings.has(bindingKey)) {
    return 0;
  }
  visitedBindings.add(bindingKey);

  if (binding.path?.node?.type === 'VariableDeclarator') {
    if (binding.path.node.init) {
      return estimateRootCount(binding.path.node.init, binding.path.scope, visitedBindings);
    }

    const assignmentRightNode = getSingleBindingAssignment(binding);
    if (assignmentRightNode) {
      return estimateRootCount(
        assignmentRightNode,
        binding.path.scope,
        visitedBindings,
      );
    }
  }

  return 0;
}

function collectIdentifierRootTargets(
  node: any,
  scope: any,
  visitedBindings: Set<string>,
) {
  if (!scope || node.name === 'undefined') {
    return [];
  }

  const binding = scope.getBinding?.(node.name);
  if (!binding) {
    return [];
  }

  const bindingKey = `${binding.identifier?.start ?? ''}:${binding.identifier?.name ?? ''}`;
  if (visitedBindings.has(bindingKey)) {
    return [];
  }
  visitedBindings.add(bindingKey);

  if (binding.path?.node?.type === 'VariableDeclarator') {
    if (binding.path.node.init) {
      return collectRootTargets(
        binding.path.node.init,
        binding.path.scope,
        visitedBindings,
      );
    }

    const assignmentRightNode = getSingleBindingAssignment(binding);
    if (assignmentRightNode) {
      return collectRootTargets(
        assignmentRightNode,
        binding.path.scope,
        visitedBindings,
      );
    }
  }

  return [];
}

function getSingleBindingAssignment(binding: any) {
  const assignmentPaths = (binding.constantViolations || []).filter(
    (violationPath: any) =>
      violationPath.isAssignmentExpression?.() &&
      violationPath.node.left?.type === 'Identifier' &&
      violationPath.node.left.name === binding.identifier?.name,
  );

  if (assignmentPaths.length !== 1) {
    return null;
  }

  return assignmentPaths[0].node.right;
}

function injectDynamicPathAttribute(
  node: any,
  s: MagicString,
  filePath: string,
  dynamicInjectedElements: Set<number>,
  propExpression: string,
  escapeTags: EscapeTags,
) {
  const openingElement = node?.openingElement;
  const nodeName = getJsxNodeName(openingElement?.name);
  if (
    !openingElement ||
    !nodeName ||
    isEscapedJsxTag(escapeTags, nodeName) ||
    hasPathAttribute(openingElement.attributes)
  ) {
    return;
  }

  // 组件根节点优先显示调用点路径；没有调用点信息时再退回定义处路径。
  dynamicInjectedElements.add(openingElement.start);

  const insertPosition =
    openingElement.end - (openingElement.selfClosing ? 2 : 1);
  const addition = ` ${PathName}={${propExpression} || ${JSON.stringify(
    getNodePathValue(filePath, node, nodeName),
  )}}${openingElement.attributes.length ? ' ' : ''}`;

  s.prependLeft(insertPosition, addition);
}

function injectStaticCreateElementPath(
  node: any,
  s: MagicString,
  content: string,
  filePath: string,
  dynamicInjectedCreateElementCalls: Set<number>,
  escapeTags: EscapeTags,
) {
  if (dynamicInjectedCreateElementCalls.has(node.start)) {
    return;
  }

  const nodeName = getCreateElementNodeName(node);
  if (!nodeName || isEscapedJsxTag(escapeTags, nodeName)) {
    return;
  }

  injectCreateElementPath(
    node,
    s,
    content,
    JSON.stringify(getNodePathValue(filePath, node, nodeName)),
  );
}

function injectDynamicCreateElementPath(
  node: any,
  s: MagicString,
  content: string,
  filePath: string,
  dynamicInjectedCreateElementCalls: Set<number>,
  propExpression: string,
  escapeTags: EscapeTags,
) {
  const nodeName = getCreateElementNodeName(node);
  if (
    dynamicInjectedCreateElementCalls.has(node.start) ||
    !nodeName ||
    isEscapedJsxTag(escapeTags, nodeName)
  ) {
    return;
  }

  // 组件根节点优先显示调用点路径；没有调用点信息时再退回定义处路径。
  dynamicInjectedCreateElementCalls.add(node.start);
  injectCreateElementPath(
    node,
    s,
    content,
    `${propExpression} || ${JSON.stringify(getNodePathValue(filePath, node, nodeName))}`,
  );
}

export function injectCreateElementPath(
  node: any,
  s: MagicString,
  content: string,
  pathExpression: string,
) {
  const propsArgument = node.arguments?.[1];
  if (hasCreateElementPathProperty(propsArgument)) {
    return;
  }

  if (!propsArgument) {
    const typeArgument = node.arguments?.[0];
    if (!typeArgument?.end) {
      return;
    }
    s.appendLeft(
      typeArgument.end,
      `, { ${JSON.stringify(PathName)}: ${pathExpression} }`,
    );
    return;
  }

  if (propsArgument.type === 'ObjectExpression') {
    s.prependLeft(
      propsArgument.start + 1,
      `${JSON.stringify(PathName)}: ${pathExpression}${
        propsArgument.properties.length ? ', ' : ''
      }`,
    );
    return;
  }

  s.overwrite(
    propsArgument.start,
    propsArgument.end,
    `Object.assign({}, ${content.slice(
      propsArgument.start,
      propsArgument.end,
    )}, { ${JSON.stringify(PathName)}: ${pathExpression} })`,
  );
}

function hasCreateElementPathProperty(node: any) {
  if (node?.type !== 'ObjectExpression') {
    return false;
  }

  return node.properties.some(
    (property: any) =>
      property?.type === 'ObjectProperty' &&
      getObjectPropertyName(property.key) === PathName,
  );
}

function hasPathAttribute(attributes: any[] = []) {
  return attributes.some(
    (attr: any) =>
      attr.type !== 'JSXSpreadAttribute' && attr.name?.name === PathName,
  );
}

export function getJsxNodeName(node: any): string {
  if (!node) {
    return '';
  }

  if (node.type === 'JSXIdentifier') {
    return node.name;
  }

  if (node.type === 'JSXMemberExpression') {
    return `${getJsxNodeName(node.object)}.${getJsxNodeName(node.property)}`;
  }

  if (node.type === 'JSXNamespacedName') {
    return `${getJsxNodeName(node.namespace)}:${getJsxNodeName(node.name)}`;
  }

  return '';
}

function isCreateElementCall(node: any) {
  return getCallExpressionName(node?.callee) === 'createElement';
}

function isCreatePortalCall(node: any) {
  return getCallExpressionName(node?.callee) === 'createPortal';
}

function getCreateElementNodeName(node: any): string {
  if (!isCreateElementCall(node)) {
    return '';
  }

  return getExpressionName(node.arguments?.[0]);
}

export function getCallExpressionName(node: any): string {
  if (!node) {
    return '';
  }

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property?.type === 'Identifier'
  ) {
    return node.property.name;
  }

  return '';
}

export function getExpressionName(node: any): string {
  if (!node) {
    return '';
  }

  if (node.type === 'StringLiteral') {
    return node.value;
  }

  if (node.type === 'Identifier') {
    return node.name;
  }

  if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property?.type === 'Identifier'
  ) {
    return `${getExpressionName(node.object)}.${node.property.name}`;
  }

  return '';
}

function isEscapedJsxTag(escapeTags: EscapeTags, nodeName: string) {
  return (
    isEscapeTags(escapeTags, nodeName) ||
    isEscapeTags(escapeTags, nodeName.split('.').pop() || nodeName)
  );
}

function getNodePathValue(filePath: string, node: any, nodeName: string) {
  const { line, column } = node.loc.start;
  return `${filePath}:${line}:${column + 1}:${nodeName}`;
}

export const __TEST__ = {
  hasExportDefaultAncestor,
  getPropagatedPathExpression,
  getObjectPatternPathBinding,
  getObjectPropertyName,
  getEmptyParamsInsertPosition,
  shouldPropagatePathToExpression,
  estimateRootCount,
  collectRootTargets,
  isEscapedJsxTag,
};
