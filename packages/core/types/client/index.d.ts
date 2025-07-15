import { LitElement } from 'lit';
interface NodeParseResultTracked {
    isTrackNode: true;
    isAstroNode: boolean;
    originNode: HTMLElement;
    name: string;
    path: string;
    line: number;
    rect: string;
    column: number;
}
interface NodeParseResultUntracked {
    isTrackNode: false;
}
type NodeParseResult = NodeParseResultTracked | NodeParseResultUntracked;
interface LayerPosition {
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
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
    ip: string;
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
    infoClassName: {
        vertical: string;
        horizon: string;
    };
    infoWidth: string;
    show: boolean;
    showLayerPanel: boolean;
    layerPanelPosition: LayerPosition;
    elementTree: any[];
    dragging: boolean;
    mousePosition: {
        baseX: number;
        baseY: number;
        moveX: number;
        moveY: number;
    };
    open: boolean;
    moved: boolean;
    hoverSwitch: boolean;
    preUserSelect: string;
    sendType: 'xhr' | 'img';
    inspectorSwitchRef: HTMLDivElement;
    inspectorLayersRef: HTMLDivElement;
    isTracking: (e: any) => boolean | "";
    getDomPropertyValue: (target: HTMLElement, property: string) => number;
    renderCover: (target: HTMLElement) => void;
    removeCover: () => void;
    renderLayerPanel: (nodeTree: NodeParseResult[], { x, y }: {
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
    copyToClipboard(text: string): void;
    moveSwitch: (e: MouseEvent | TouchEvent) => void;
    isSamePositionNode: (node1: HTMLElement, node2: HTMLElement) => boolean;
    handleMouseMove: (e: MouseEvent | TouchEvent) => void;
    handleMouseClick: (e: MouseEvent | TouchEvent) => void;
    handleContextMenu: (e: MouseEvent) => void;
    generateNodeTree: (nodePath: HTMLElement[]) => NodeParseResultTracked[];
    /**
     * MARK: 解析节点信息
     */
    parseNode: (node: HTMLElement) => NodeParseResult;
    handlePointerDown: (e: PointerEvent) => void;
    handleKeyUp: (e: KeyboardEvent) => void;
    printTip: () => void;
    getMousePosition: (e: MouseEvent | TouchEvent) => {
        x: number;
        y: number;
    };
    recordMousePosition: (e: MouseEvent | TouchEvent) => void;
    handleMouseUp: (e: MouseEvent | TouchEvent) => void;
    switch: (e: Event) => void;
    handleLayerPanelClick: (e: MouseEvent) => void;
    protected firstUpdated(): void;
    disconnectedCallback(): void;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
export {};
