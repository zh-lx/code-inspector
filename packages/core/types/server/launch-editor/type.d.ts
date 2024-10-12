import { Editor } from "../../shared";
export type Platform = 'darwin' | 'linux' | 'win32';
export type EDITOR_PROCESS_MAP = {
    [key in Editor]?: string[];
};
