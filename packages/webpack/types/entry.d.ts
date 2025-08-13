type EntryItem = string | string[];
interface EntryDescription {
    import: EntryItem;
}
type EntryStatic = string | string[] | EntryObject;
interface EntryObject {
    [index: string]: string | string[] | EntryDescription;
}
type Entry = EntryStatic | (() => EntryStatic | Promise<EntryStatic>);
export declare function getWebpackEntrys(entry: Entry, context: string): Promise<string[]>;
export {};
