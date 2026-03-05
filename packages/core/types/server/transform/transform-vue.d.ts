import { EscapeTags } from '../../shared';
export declare function transformVue(content: string, filePath: string, escapeTags: EscapeTags): string;
/**
 * Transform standalone HTML template files used as Vue templates.
 * These are .html files that contain Vue template syntax and are loaded via
 * require('./xxx.html') rather than through vue-loader's SFC mechanism.
 *
 * Unlike transformVue which handles full .vue SFC files, this function
 * directly parses the HTML content as a Vue template fragment.
 */
export declare function transformVueHtml(content: string, filePath: string, escapeTags: EscapeTags): string;
