import { LitElement, TemplateResult } from 'lit';
interface Position {
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
    transform?: string;
    maxHeight?: string;
}
interface SourceInfo {
    name: string;
    path: string;
    line: number;
    column: number;
}
interface ElementTipStyle {
    vertical: string;
    horizon: string;
    visibility: string;
    additionStyle?: {
        transform: string;
    };
}
interface TreeNode extends SourceInfo {
    children: TreeNode[];
    element: HTMLElement;
    depth: number;
}
interface ActiveNode {
    top?: string;
    bottom?: string;
    left?: string;
    width?: string;
    content?: string;
    visibility?: 'visible' | 'hidden';
    class?: 'tooltip-top' | 'tooltip-bottom';
}
export declare class CodeInspectorComponent extends LitElement {
    hotKeys: string;
    port: number;
    showSwitch: boolean;
    autoToggle: boolean;
    hideConsole: boolean;
    locate: boolean;
    copy: boolean | string;
    target: string;
    targetNode: HTMLElement | null;
    ip: string;
    private wheelThrottling;
    modeKey: string;
    position: {
        top: number;
        right: number;
        bottom: number;
        left: number;
        padding: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        border: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        margin: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
    };
    element: {
        name: string;
        line: number;
        column: number;
        path: string;
    };
    elementTipStyle: ElementTipStyle;
    show: boolean;
    showNodeTree: boolean;
    nodeTreePosition: Position;
    nodeTree: TreeNode | null;
    dragging: boolean;
    mousePosition: {
        baseX: number;
        baseY: number;
        moveX: number;
        moveY: number;
    };
    draggingTarget: 'switch' | 'nodeTree';
    open: boolean;
    moved: boolean;
    hoverSwitch: boolean;
    preUserSelect: string;
    sendType: 'xhr' | 'img';
    activeNode: ActiveNode;
    showSettingsModal: boolean;
    internalLocate: boolean;
    internalCopy: boolean;
    internalTarget: boolean;
    inspectorSwitchRef: HTMLDivElement;
    codeInspectorContainerRef: HTMLDivElement;
    elementInfoRef: HTMLDivElement;
    nodeTreeRef: HTMLDivElement;
    nodeTreeTitleRef: HTMLDivElement;
    nodeTreeTooltipRef: HTMLDivElement;
    features: {
        label: string;
        description: string;
        checked: () => boolean;
        onChange: () => void;
    }[];
    private eventListeners;
    isTracking: (e: any) => boolean | "";
    getDomPropertyValue: (target: HTMLElement, property: string) => number;
    calculateElementInfoPosition: (target: HTMLElement) => Promise<{
        vertical: string;
        horizon: string;
        top: number;
        left: number;
        isExternal: boolean;
        additionStyle?: undefined;
    } | {
        vertical: string;
        horizon: string;
        top: number;
        left: number;
        isExternal: boolean;
        additionStyle: {
            transform: string;
        };
    }>;
    renderCover: (target: HTMLElement) => Promise<void>;
    getAstroFilePath: (target: HTMLElement) => string;
    getSourceInfo: (target: HTMLElement) => SourceInfo | null;
    removeCover: (force?: boolean | MouseEvent) => void;
    renderLayerPanel: (nodeTree: TreeNode, { x, y }: {
        x: number;
        y: number;
    }) => void;
    removeLayerPanel: () => void;
    addGlobalCursorStyle: () => void;
    removeGlobalCursorStyle: () => void;
    sendXHR: () => void;
    sendImg: () => void;
    buildTargetUrl: () => string;
    trackCode: () => void;
    private handleModeShortcut;
    showNotification(message: string, type?: 'success' | 'error'): void;
    copyToClipboard(text: string): void;
    private fallbackCopy;
    handleDrag: (e: MouseEvent | TouchEvent) => void;
    getValidNodeList: (nodePath: HTMLElement[]) => {
        node: HTMLElement;
        isAstro: boolean;
    }[];
    isSamePositionNode: (node1: HTMLElement, node2: HTMLElement) => boolean;
    handleMouseMove: (e: MouseEvent | TouchEvent) => Promise<void>;
    handleWheel: (e: WheelEvent) => void;
    handleMouseClick: (e: MouseEvent | TouchEvent) => void;
    handleContextMenu: (e: MouseEvent) => void;
    generateNodeTree: (nodePath: HTMLElement[]) => TreeNode;
    handlePointerDown: (e: PointerEvent) => void;
    handleKeyUp: (e: KeyboardEvent) => void;
    printTip: () => void;
    getMousePosition: (e: MouseEvent | TouchEvent) => {
        x: number;
        y: number;
    };
    recordMousePosition: (e: MouseEvent | TouchEvent, target: 'switch' | 'nodeTree') => void;
    handleMouseUp: (e: MouseEvent | TouchEvent) => void;
    switch: (e: Event) => void;
    handleClickTreeNode: (node: TreeNode) => void;
    handleMouseEnterNode: (e: MouseEvent, node: TreeNode) => Promise<void>;
    handleMouseLeaveNode: () => void;
    toggleSettingsModal: () => void;
    closeSettingsModal: () => void;
    toggleLocate: () => void;
    toggleCopy: () => void;
    toggleTarget: () => void;
    /**
     * Attach all event listeners
     */
    private attachEventListeners;
    /**
     * Detach all event listeners
     */
    private detachEventListeners;
    protected firstUpdated(): void;
    disconnectedCallback(): void;
    renderNodeTree: (node: TreeNode) => TemplateResult;
    render(): TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
