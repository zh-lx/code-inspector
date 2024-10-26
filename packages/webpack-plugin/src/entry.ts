/**
 * https://webpack.js.org/configuration/entry-context/#entry
 */
import { normalizePath } from 'code-inspector-core';
import path from 'path';

type EntryItem = string | string[];

interface EntryDescription {
  import: EntryItem;
}

type EntryStatic = string | string[] | EntryObject;

interface EntryObject {
  [index: string]: string | string[] | EntryDescription;
}

type Entry = EntryStatic | (() => EntryStatic | Promise<EntryStatic>);

// 处理 webpack entrys 获取绝对路径
export async function getWebpackEntrys(
  entry: Entry,
  context: string
): Promise<string[]> {
  if (!entry || !context) {
    return [];
  }

  const staticEntry: EntryStatic =
    typeof entry === 'function' ? await entry() : entry;

  let entries: string[] = [];

  if (typeof staticEntry === 'object' && !Array.isArray(staticEntry)) {
    // EntryObject
    for (const key in staticEntry) {
      const entryObject = staticEntry[key];
      const _stackEntry =
        (entryObject as EntryDescription).import ||
        (entryObject as string | string[]);
      collectEntries(entries, _stackEntry, context);
    }
  } else {
    collectEntries(entries, staticEntry, context);
  }

  return entries.filter((_entry) => !!_entry);
}

function collectEntries(
  entries: string[],
  staticEntry: string | string[],
  context: string
): void {
  if (typeof staticEntry === 'string') {
    // string
    entries.push(convertToAbsolutePath(staticEntry, context));
  } else if (Array.isArray(staticEntry)) {
    // string[]
    entries.push(
      ...staticEntry.map((item) => convertToAbsolutePath(item, context))
    );
  }
}

function convertToAbsolutePath(entry: string, context: string): string {
  if (path.isAbsolute(entry)) {
    return normalizePath(entry);
  }
  if (!entry.startsWith('.')) {
    return '';
  }
  return path.resolve(context, normalizePath(entry));
}
