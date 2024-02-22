import { LitElement } from 'lit';
export declare class CodeInspectorComponent extends LitElement {
    hotKeys: string;
    port: number;
    showSwitch: boolean;
    autoToggle: boolean;
    hideConsole: boolean;
    locate: boolean;
    copy: boolean | string;
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
    moveSwitch: (e: MouseEvent) => void;
    handleMouseup: () => void;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseClick: (e: any) => void;
    handlePointerDown: (e: any) => void;
    handleKeyUp: (e: any) => void;
    printTip: () => void;
    recordMousePosition: (e: MouseEvent) => void;
    handleMouseUp: () => void;
    switch: (e: Event) => void;
    protected firstUpdated(): void;
    disconnectedCallback(): void;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
