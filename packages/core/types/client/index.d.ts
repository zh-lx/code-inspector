import { LitElement } from 'lit';
export declare class MyElement extends LitElement {
    hotKeys: string;
    port: number;
    showSwitch: boolean;
    autoToggle: boolean;
    position: {
        top: number;
        left: number;
        width: number;
        height: number;
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
    inspectorSwitchRef: HTMLDivElement;
    isTracking: (e: any) => boolean | "";
    renderCover: (target: HTMLElement) => void;
    removeCover: () => void;
    addGlobalCursorStyle: () => void;
    removeGlobalCursorStyle: () => void;
    trackCode: () => void;
    moveSwitch: (e: MouseEvent) => void;
    handleMouseMove: (e: MouseEvent) => void;
    handleMouseClick: (e: any) => void;
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
