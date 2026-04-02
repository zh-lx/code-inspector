import MagicString from 'magic-string';
import { EscapeTags } from '../../shared';
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
export declare const pugMap: Map<string, PugFileInfo>;
export declare function belongTemplate(target: AstLocation, start: AstLocation, end: AstLocation): boolean;
interface TransformPugParams {
    node: pug.Node | null | undefined;
    templateNode: ElementNode;
    s: MagicString;
    escapeTags: EscapeTags;
    filePath: string;
}
export declare function transformPugAst(params: TransformPugParams): void;
/**
 * Check if a template node uses Pug syntax
 * @param templateNode - The template element node to check
 * @returns true if the template uses Pug, false otherwise
 */
export declare function isPugTemplate(templateNode: ElementNode | undefined): boolean;
/**
 * Calculate line offsets for content
 * @param content - The file content
 * @returns Array of line offsets
 */
export declare function calculateLineOffsets(content: string): number[];
/**
 * Transform Pug template in Vue SFC
 * @param content - The file content
 * @param filePath - The file path
 * @param templateNode - The template element node
 * @param escapeTags - Tags to escape from transformation
 * @param s - MagicString instance for code transformation
 */
export declare function transformPugTemplate(content: string, filePath: string, templateNode: ElementNode, escapeTags: EscapeTags, s: MagicString): void;
export {};
