import { LitElement } from 'lit';
export declare class CodeInspectorComponent extends LitElement {
    hotKeys: string;
    port: number;
    showSwitch: boolean;
    autoToggle: boolean;
    hideConsole: boolean;
    locate: boolean;
    copy: boolean | string;
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
    isTracking: (e: any) => boolean | "";
    getDomPropertyValue: (target: HTMLElement, property: string) => number;
    renderCover: (target: HTMLElement) => void;
    removeCover: () => void;
    addGlobalCursorStyle: () => void;
    removeGlobalCursorStyle: () => void;
    sendXHR: () => void;
    sendImg: () => void;
    trackCode: () => void;
    copyToClipboard(text: string): void;
    moveSwitch: (e: MouseEvent | TouchEvent) => void;
    isSamePositionNode: (node1: HTMLElement, node2: HTMLElement) => boolean;
    handleMouseMove: (e: MouseEvent | TouchEvent) => void;
    handleMouseClick: (e: MouseEvent | TouchEvent) => void;
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
    protected firstUpdated(): void;
    disconnectedCallback(): void;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
