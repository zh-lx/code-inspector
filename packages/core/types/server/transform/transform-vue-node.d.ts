import type { NodeTransform } from '@vue/compiler-dom';
import type { EscapeTags, PathType } from '../../shared';
type VueInspectorNodeTransformOptions = {
    escapeTags?: EscapeTags;
    pathType?: PathType;
    mappings?: Record<string, string> | Array<{
        find: string | RegExp;
        replacement: string;
    }>;
};
export declare function createVueInspectorNodeTransform(options?: VueInspectorNodeTransformOptions): NodeTransform;
export {};
