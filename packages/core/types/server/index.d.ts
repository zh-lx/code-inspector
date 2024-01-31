import { Editor } from '../shared/constant';
export { transformCode } from './transform';
export { getCodeWithWebComponent } from './inject-code';
export declare function startServer(callback: (port: number) => any, editor?: Editor): void;
