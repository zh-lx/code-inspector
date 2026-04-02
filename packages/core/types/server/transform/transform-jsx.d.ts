import MagicString from 'magic-string';
import { EscapeTags } from '../../shared';
type RootTarget = {
    type: 'jsx';
    node: any;
} | {
    type: 'createElement';
    node: any;
};
export declare function transformJsx(content: string, filePath: string, escapeTags: EscapeTags): string;
declare function hasExportDefaultAncestor(path: any): boolean;
declare function getPropagatedPathExpression(path: any, s: MagicString, content: string): string;
declare function getObjectPatternPathBinding(param: any): string;
declare function getObjectPropertyName(node: any): string;
declare function getEmptyParamsInsertPosition(node: any, content: string): any;
declare function collectRootTargets(node: any, scope: any, visitedBindings?: Set<string>): RootTarget[];
declare function shouldPropagatePathToExpression(node: any, scope: any, visitedBindings?: Set<string>): boolean;
declare function estimateRootCount(node: any, scope: any, visitedBindings: Set<string>): number;
export declare function injectCreateElementPath(node: any, s: MagicString, content: string, pathExpression: string): void;
export declare function getJsxNodeName(node: any): string;
export declare function getCallExpressionName(node: any): string;
export declare function getExpressionName(node: any): string;
declare function isEscapedJsxTag(escapeTags: EscapeTags, nodeName: string): boolean;
export declare const __TEST__: {
    hasExportDefaultAncestor: typeof hasExportDefaultAncestor;
    getPropagatedPathExpression: typeof getPropagatedPathExpression;
    getObjectPatternPathBinding: typeof getObjectPatternPathBinding;
    getObjectPropertyName: typeof getObjectPropertyName;
    getEmptyParamsInsertPosition: typeof getEmptyParamsInsertPosition;
    shouldPropagatePathToExpression: typeof shouldPropagatePathToExpression;
    estimateRootCount: typeof estimateRootCount;
    collectRootTargets: typeof collectRootTargets;
    isEscapedJsxTag: typeof isEscapedJsxTag;
};
export {};
