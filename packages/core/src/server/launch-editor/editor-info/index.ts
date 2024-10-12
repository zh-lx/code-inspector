import { COMMON_EDITORS_OSX, EDITOR_PROCESS_MAP_OSX } from './mac';
import { COMMON_EDITORS_LINUX, EDITOR_PROCESS_MAP_LINUX } from './linux';
import { COMMON_EDITORS_WIN, EDITOR_PROCESS_MAP_WIN } from './windows';
import { EDITOR_PROCESS_MAP, Platform } from '../type';


export const COMMON_EDITORS_MAP: Record<Platform, Record<string, string>> = {
  darwin: COMMON_EDITORS_OSX,
  linux: COMMON_EDITORS_LINUX,
  win32: COMMON_EDITORS_WIN,
};

export const COMMON_EDITOR_PROCESS_MAP: Record<Platform, EDITOR_PROCESS_MAP> = {
  darwin: EDITOR_PROCESS_MAP_OSX,
  linux: EDITOR_PROCESS_MAP_LINUX,
  win32: EDITOR_PROCESS_MAP_WIN,
};