import { LitElement } from 'lit';
export declare class MyElement extends LitElement {
    hotKeys: string;
    port: number;
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
    show: boolean;
    isTracking: (e: any) => boolean;
    renderCover: (target: HTMLElement) => void;
    removeCover: () => void;
    addGlobalCursorStyle: () => void;
    removeGlobalCursorStyle: () => void;
    trackCode: () => void;
    handleMouseMove: () => void;
    handleMouseClick: (e: any) => void;
    handleKeyUp: (e: any) => void;
    protected firstUpdated(): void;
    disconnectedCallback(): void;
    render(): import("lit").TemplateResult<1>;
    static styles: import("lit").CSSResult;
}
