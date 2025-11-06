import { LitElement, TemplateResult, css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { PathName, DefaultPort } from '../shared';
import { formatOpenPath } from 'launch-ide';

const styleId = '__code-inspector-unique-id';
const AstroFile = 'data-astro-source-file';
const AstroLocation = 'data-astro-source-loc';

const MacHotKeyMap = {
  ctrlKey: '^control',
  altKey: '⌥option',
  metaKey: '⌘command',
  shiftKey: 'shift',
};

const WindowsHotKeyMap = {
  ctrlKey: 'Ctrl',
  altKey: 'Alt',
  metaKey: '⊞Windows',
  shiftKey: 'Shift',
};

interface CodeInspectorHtmlElement extends HTMLElement {
  'data-insp-path': string;
}

interface Position {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  transform?: string;
  maxHeight?: string;
}

interface SourceInfo {
  name: string; // tagName
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

type InspectorAction = 'copy' | 'locate' | 'target' | 'all';
type TrackAction = InspectorAction | 'default';
type ResolvedAction = InspectorAction | 'none';

const PopperWidth = 300;

function nextTick() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

export class CodeInspectorComponent extends LitElement {
  @property()
  hotKeys: string = 'shiftKey,altKey';
  @property()
  port: number = DefaultPort;
  @property()
  showSwitch: boolean = false;
  @property()
  autoToggle: boolean = false;
  @property()
  hideConsole: boolean = false;
  @property()
  locate: boolean = true;
  @property()
  copy: boolean | string = true;
  @property({ attribute: 'default-action' })
  defaultAction: InspectorAction = 'copy';
  @property()
  target: string = '';
  @property()
  ip: string = 'localhost';

  @state()
  position = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    border: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  }; // 弹窗位置
  @state()
  element = { name: '', line: 0, column: 0, path: '' }; // 选中节点信息
  @state()
  elementTipStyle: ElementTipStyle = {
    vertical: '',
    horizon: '',
    visibility: '',
  }; // 信息浮块位置类名
  @state()
  show = false; // 是否展示
  @state()
  showNodeTree = false; // 是否展示图层面板
  @state()
  nodeTreePosition: Position = {}; // 图层面板位置
  @state()
  nodeTree: TreeNode | null = null; // 节点树
  @state()
  dragging = false; // 是否正在拖拽中
  @state()
  mousePosition = { baseX: 0, baseY: 0, moveX: 0, moveY: 0 };
  @state()
  draggingTarget: 'switch' | 'nodeTree' = 'switch'; // 是否正在拖拽节点树
  @state()
  open = false; // 点击开关打开
  @state()
  moved = false;
  @state()
  hoverSwitch = false;
  @state()
  preUserSelect = '';
  @state()
  sendType: 'xhr' | 'img' = 'xhr';
  @state()
  activeNode: ActiveNode = {};

  @query('#inspector-switch')
  inspectorSwitchRef!: HTMLDivElement;

  @query('#code-inspector-container')
  codeInspectorContainerRef!: HTMLDivElement;
  @query('#element-info')
  elementInfoRef!: HTMLDivElement;
  @query('#inspector-node-tree')
  nodeTreeRef!: HTMLDivElement;

  @query('.inspector-layer-title')
  nodeTreeTitleRef!: HTMLDivElement;
  @query('#node-tree-tooltip')
  nodeTreeTooltipRef!: HTMLDivElement;

  isTracking = (e: any) => {
    return (
      this.hotKeys && this.hotKeys.split(',').every((key) => e[key.trim()])
    );
  };

  // 20px -> 20
  getDomPropertyValue = (target: HTMLElement, property: string) => {
    const computedStyle = window.getComputedStyle(target);
    return Number(computedStyle.getPropertyValue(property).replace('px', ''));
  };

  // 计算 element-info 的最佳位置
  calculateElementInfoPosition = async (target: HTMLElement) => {
    const { top, right, bottom, left } = target.getBoundingClientRect();
    const browserHeight = document.documentElement.clientHeight;
    const browserWidth = document.documentElement.clientWidth;
    const marginTop = this.getDomPropertyValue(target, 'margin-top');
    const marginRight = this.getDomPropertyValue(target, 'margin-right');
    const marginBottom = this.getDomPropertyValue(target, 'margin-bottom');
    const marginLeft = this.getDomPropertyValue(target, 'margin-left');

    await nextTick();

    const { width, height } = this.elementInfoRef.getBoundingClientRect();

    // 容器的实际边界（包含 margin）
    const containerTop = top - marginTop;
    const containerRight = right + marginRight;
    const containerBottom = bottom + marginBottom;
    const containerLeft = left - marginLeft;

    // 定义八个位置的计算方法
    const positions = [
      // 外部位置
      {
        // 右下方(外部)
        vertical: 'element-info-bottom',
        horizon: 'element-info-right',
        top: containerBottom,
        left: containerLeft,
        isExternal: true,
      },
      {
        // 左下方(外部)
        vertical: 'element-info-bottom',
        horizon: 'element-info-left',
        top: containerBottom,
        left: containerRight - width,
        isExternal: true,
      },
      {
        // 右上方(外部)
        vertical: 'element-info-top',
        horizon: 'element-info-right',
        top: containerTop - height,
        left: containerLeft,
        isExternal: true,
      },
      {
        // 左上方(外部)
        vertical: 'element-info-top',
        horizon: 'element-info-left',
        top: containerTop - height,
        left: containerRight - width,
        isExternal: true,
      },
      // 内部位置
      {
        // 右下方(内部)
        vertical: 'element-info-bottom-inner',
        horizon: 'element-info-right',
        top: containerBottom - height,
        left: containerLeft,
        isExternal: false,
      },
      {
        // 左下方(内部)
        vertical: 'element-info-bottom-inner',
        horizon: 'element-info-left',
        top: containerBottom - height,
        left: containerRight - width,
        isExternal: false,
      },
      {
        // 右上方(内部)
        vertical: 'element-info-top-inner',
        horizon: 'element-info-right',
        top: containerTop,
        left: containerLeft,
        isExternal: false,
      },
      {
        // 左上方(内部)
        vertical: 'element-info-top-inner',
        horizon: 'element-info-left',
        top: containerTop,
        left: containerRight - width,
        isExternal: false,
      },
      // 超出屏幕
      {
        // 左上方(屏幕内)
        vertical: 'element-info-top-inner',
        horizon: 'element-info-left',
        top: Math.max(0, containerTop),
        left: containerRight - width,
        isExternal: false,
        additionStyle: {
          transform: `translateY(${Math.max(0, -containerTop)}px)`,
        },
      },
      {
        // 右上方(屏幕内)
        vertical: 'element-info-top-inner',
        horizon: 'element-info-right',
        top: Math.max(0, containerTop),
        left: containerRight - width,
        isExternal: false,
        additionStyle: {
          transform: `translateY(${Math.max(0, -containerTop)}px)`,
        },
      },
    ];

    // 检查位置是否超出屏幕
    const isOutOfScreen = (pos: { left: number; top: number }) => {
      return (
        pos.left < 0 ||
        pos.left + width > browserWidth ||
        pos.top < 0 ||
        pos.top + height > browserHeight
      );
    };

    for (const pos of positions) {
      const browserWidth = document.documentElement.clientWidth;
      if (pos.horizon.endsWith('left')) {
        const overflowWidth = containerLeft + width - browserWidth;
        if (overflowWidth > 0) {
          pos.additionStyle = {
            transform: `translateX(-${overflowWidth}px) ${
              pos.additionStyle?.transform || ''
            }`,
          };
        }
      } else {
        const overflowWidth = width - containerRight;
        if (overflowWidth > 0) {
          pos.additionStyle = {
            transform: `translateX(${overflowWidth}px) ${
              pos.additionStyle?.transform || ''
            }`,
          };
        }
      }
      if (!isOutOfScreen(pos)) {
        return pos;
      }
    }
    // 如果所有位置都超出屏幕，返回一个屏幕内侧的位置
    return positions[0];
  };

  // 渲染遮罩层
  renderCover = async (target: HTMLElement) => {
    // 设置 target 的位置
    const { top, right, bottom, left } = target.getBoundingClientRect();
    this.position = {
      top,
      right,
      bottom,
      left,
      border: {
        top: this.getDomPropertyValue(target, 'border-top-width'),
        right: this.getDomPropertyValue(target, 'border-right-width'),
        bottom: this.getDomPropertyValue(target, 'border-bottom-width'),
        left: this.getDomPropertyValue(target, 'border-left-width'),
      },
      padding: {
        top: this.getDomPropertyValue(target, 'padding-top'),
        right: this.getDomPropertyValue(target, 'padding-right'),
        bottom: this.getDomPropertyValue(target, 'padding-bottom'),
        left: this.getDomPropertyValue(target, 'padding-left'),
      },
      margin: {
        top: this.getDomPropertyValue(target, 'margin-top'),
        right: this.getDomPropertyValue(target, 'margin-right'),
        bottom: this.getDomPropertyValue(target, 'margin-bottom'),
        left: this.getDomPropertyValue(target, 'margin-left'),
      },
    };

    // 设置位置类名
    this.elementTipStyle = {
      vertical: '',
      horizon: '',
      visibility: 'hidden',
    };

    // 增加鼠标光标样式
    this.addGlobalCursorStyle();
    // 防止 select
    if (!this.preUserSelect) {
      this.preUserSelect = getComputedStyle(document.body).userSelect;
    }
    document.body.style.userSelect = 'none';
    this.element = this.getSourceInfo(target)!;
    this.show = true;
    if (!this.showNodeTree) {
      const { vertical, horizon, additionStyle } =
        await this.calculateElementInfoPosition(target);
      this.elementTipStyle = {
        vertical,
        horizon,
        visibility: 'visible',
        additionStyle,
      };
    }
  };

  getAstroFilePath = (target: HTMLElement): string => {
    if (target.getAttribute?.(AstroFile)) {
      return `${target.getAttribute(AstroFile)}:${target.getAttribute(
        AstroLocation
      )}:${target.tagName.toLowerCase()}`;
    }
    return '';
  };

  getSourceInfo = (target: HTMLElement): SourceInfo | null => {
    let paths =
      target.getAttribute?.(PathName) ||
      (target as CodeInspectorHtmlElement)[PathName] ||
      this.getAstroFilePath(target); // Todo: transform astro inside

    if (!paths) {
      return null;
    }

    const segments = paths.split(':');
    const name = segments[segments.length - 1];
    const column = Number(segments[segments.length - 2]);
    const line = Number(segments[segments.length - 3]);
    const path = segments.slice(0, segments.length - 3).join(':');
    return { name, path, line, column };
  };

  removeCover = (force?: boolean | MouseEvent) => {
    if (force !== true && this.nodeTree) {
      return;
    }
    this.show = false;
    this.removeGlobalCursorStyle();
    document.body.style.userSelect = this.preUserSelect;
    this.preUserSelect = '';
  };

  renderLayerPanel = (
    nodeTree: TreeNode,
    { x, y }: { x: number; y: number }
  ) => {
    const browserWidth = document.documentElement.clientWidth;
    const browserHeight = document.documentElement.clientHeight;

    const rightToViewPort = browserWidth - x;
    const bottomToViewPort = browserHeight - y;
    let position: Position = {};

    if (rightToViewPort < x) {
      position['right'] = rightToViewPort + 'px';
      // 检测是否横向一定超出屏幕
      if (x < PopperWidth) {
        position['transform'] = `translateX(${PopperWidth - x}px)`;
      }
    } else {
      position['left'] = x + 'px';
      // 检测是否横向一定超出屏幕
      if (rightToViewPort < PopperWidth) {
        position['transform'] = `translateX(-${
          PopperWidth - rightToViewPort
        }px)`;
      }
    }

    if (bottomToViewPort < y) {
      position['bottom'] = bottomToViewPort + 'px';
      position['maxHeight'] = `${y - 10}px`;
    } else {
      position['top'] = y + 'px';
      position['maxHeight'] = `${browserHeight - y - 10}px`;
    }
    this.nodeTreePosition = position;
    this.nodeTree = nodeTree;
    this.showNodeTree = true;
  };

  removeLayerPanel = () => {
    this.showNodeTree = false;
    this.nodeTree = null;
    this.activeNode = {};
  };

  addGlobalCursorStyle = () => {
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.setAttribute('id', styleId);
      style.innerText = `body * {
        cursor: pointer !important;
      }`;
      document.body.appendChild(style);
    }
  };

  removeGlobalCursorStyle = () => {
    const style = document.getElementById(styleId);
    if (style) {
      style.remove();
    }
  };

  sendXHR = () => {
    const file = encodeURIComponent(this.element.path);
    const url = `http://${this.ip}:${this.port}/?file=${file}&line=${this.element.line}&column=${this.element.column}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.addEventListener('error', () => {
      this.sendType = 'img';
      this.sendImg();
    });
  };

  // 通过img方式发送请求，防止类似企业微信侧边栏等内置浏览器拦截逻辑
  sendImg = () => {
    const file = encodeURIComponent(this.element.path);
    const url = `http://${this.ip}:${this.port}/?file=${file}&line=${this.element.line}&column=${this.element.column}`;
    const img = document.createElement('img');
    img.src = url;
  };

  buildTargetUrl = () => {
    let targetUrl = this.target;

    const { path, line, column } = this.element;
    const replacementMap: Record<string, string | number> = {
      '{file}': path,
      '{line}': line,
      '{column}': column,
    };
    for (let replacement in replacementMap) {
      targetUrl = targetUrl.replace(
        new RegExp(replacement, 'g'),
        String(replacementMap[replacement])
      );
    }

    return targetUrl;
  };

  // 触发功能的处理
  trackCode = (action: TrackAction = 'default') => {
    let resolvedAction: ResolvedAction;
    if (action === 'default') {
      resolvedAction = this.getDefaultAction();
    } else if (action === 'all') {
      resolvedAction = this.copy || this.locate || this.target ? 'all' : 'none';
    } else if (this.isActionEnabled(action)) {
      resolvedAction = action;
    } else {
      resolvedAction = 'none';
    }

    if (resolvedAction === 'none') {
      return;
    }

    const shouldLocate =
      (resolvedAction === 'locate' || resolvedAction === 'all') && this.locate;
    const shouldCopy =
      (resolvedAction === 'copy' || resolvedAction === 'all') && !!this.copy;
    const shouldTarget =
      (resolvedAction === 'target' || resolvedAction === 'all') && !!this.target;

    if (!shouldLocate && !shouldCopy && !shouldTarget) {
      return;
    }

    if (shouldLocate) {
      if (this.sendType === 'xhr') {
        this.sendXHR();
      } else {
        this.sendImg();
      }
    }
    if (shouldCopy) {
      const path = formatOpenPath(
        this.element.path,
        String(this.element.line),
        String(this.element.column),
        this.copy
      );
      this.copyToClipboard(path[0]);
    }
    if (shouldTarget) {
      window.open(this.buildTargetUrl(), '_blank');
    }
    window.dispatchEvent(
      new CustomEvent('code-inspector:trackCode', {
        detail: this.element,
      })
    );
  };

  private getDefaultAction(): ResolvedAction {
    const resolved = this.resolvePreferredAction(this.defaultAction);
    if (resolved !== 'none' && resolved !== this.defaultAction) {
      this.defaultAction = resolved;
    }
    return resolved;
  }

  private isActionEnabled(action: Exclude<InspectorAction, 'all'>): boolean {
    if (action === 'copy') {
      return !!this.copy;
    }
    if (action === 'locate') {
      return !!this.locate;
    }
    return !!this.target;
  }

  private resolvePreferredAction(
    preferred: InspectorAction
  ): ResolvedAction {
    if (preferred === 'all') {
      return this.copy || this.locate || this.target ? 'all' : 'none';
    }
    if (this.isActionEnabled(preferred)) {
      return preferred;
    }
    const fallbackOrder: Array<Exclude<InspectorAction, 'all'>> = [
      'copy',
      'locate',
      'target',
    ];
    for (const candidate of fallbackOrder) {
      if (candidate !== preferred && this.isActionEnabled(candidate)) {
        return candidate;
      }
    }
    return 'none';
  }

  private getAvailableDefaultActions(): InspectorAction[] {
    const actions: InspectorAction[] = [];
    if (this.copy) {
      actions.push('copy');
    }
    if (this.locate) {
      actions.push('locate');
    }
    if (this.target) {
      actions.push('target');
    }
    if (actions.length > 1 && this.copy && this.locate) {
      actions.push('all');
    }
    return actions;
  }

  private handleModeShortcut = (e: KeyboardEvent) => {
    if (!e.shiftKey || !e.altKey) {
      return;
    }
    const code = e.code?.toLowerCase();
    const key = e.key?.toLowerCase();
    const isCKey = code ? code === 'keyc' : key === 'c';
    if (!isCKey) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const actions = this.getAvailableDefaultActions();
    if (actions.length <= 1) {
      return;
    }
    const currentIndex = actions.indexOf(this.defaultAction);
    const nextAction =
      currentIndex === -1
        ? actions[0]
        : actions[(currentIndex + 1) % actions.length];
    this.defaultAction = nextAction;
    this.printModeChange(nextAction);
  };

  private printModeChange(action: InspectorAction) {
    if (this.hideConsole) {
      return;
    }
    const label = this.getActionLabel(action);
    const agent =
      typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isWindows = ['windows', 'win32', 'wow32', 'win64', 'wow64'].some(
      (item) => agent.toUpperCase().includes(item.toUpperCase())
    );
    const shortcut = isWindows ? 'Shift+Alt+C' : 'Shift+Opt+C';
    console.log(
      `%c[code-inspector-plugin]%c Mode switched to %c${label}%c (${shortcut})`,
      'color: #006aff; font-weight: bolder; font-size: 12px;',
      'color: #006aff; font-size: 12px;',
      'color: #00B42A; font-weight: bold; font-size: 12px;',
      'color: #006aff; font-size: 12px;'
    );
  }

  private getActionLabel(action: ResolvedAction): string {
    switch (action) {
      case 'copy':
        return 'Copy Path';
      case 'locate':
        return 'Open in IDE';
      case 'target':
        return 'Open Target Link';
      case 'all':
        return 'Copy + Open';
      default:
        return 'Disabled';
    }
  }

  copyToClipboard(text: string) {
    if (typeof navigator?.clipboard?.writeText === 'function') {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  // 移动按钮
  handleDrag = (e: MouseEvent | TouchEvent) => {
    if (e.composedPath().includes(this)) {
      this.hoverSwitch = true;
    } else {
      this.hoverSwitch = false;
    }
    // 判断是否在拖拽按钮
    if (this.dragging) {
      this.moved = true;
      const ref =
        this.draggingTarget === 'switch'
          ? this.inspectorSwitchRef
          : this.nodeTreeRef;
      ref.style.left =
        this.mousePosition.baseX +
        (this.getMousePosition(e).x - this.mousePosition.moveX) +
        'px';
      ref.style.top =
        this.mousePosition.baseY +
        (this.getMousePosition(e).y - this.mousePosition.moveY) +
        'px';
      if (this.draggingTarget) {
        this.nodeTreePosition.left = ref.style.left;
        this.nodeTreePosition.top = ref.style.top;
      }
      return;
    }
  };

  isSamePositionNode = (node1: HTMLElement, node2: HTMLElement) => {
    const node1Rect = node1.getBoundingClientRect();
    const node2Rect = node2.getBoundingClientRect();
    return (
      node1Rect.top === node2Rect.top &&
      node1Rect.left === node2Rect.left &&
      node1Rect.right === node2Rect.right &&
      node1Rect.bottom === node2Rect.bottom
    );
  };

  // 鼠标移动渲染遮罩层位置
  handleMouseMove = async (e: MouseEvent | TouchEvent) => {
    if (
      ((this.isTracking(e) && !this.dragging) || this.open) &&
      !this.hoverSwitch
    ) {
      const nodePath = e.composedPath() as HTMLElement[];
      let targetNode;
      // 寻找第一个有 data-insp-path 属性的元素
      for (let i = 0; i < nodePath.length; i++) {
        const node = nodePath[i];
        if (
          (node.hasAttribute && node.hasAttribute(PathName)) ||
          node[PathName]
        ) {
          if (!targetNode) {
            targetNode = node;
          } else if (this.isSamePositionNode(targetNode, node)) {
            // 优先寻找组件被调用处源码
            targetNode = node;
          }
        }
        // Todo: transform astro inside
        if (node.hasAttribute && node.hasAttribute('data-astro-source-file')) {
          targetNode = node;
          break;
        }
      }
      if (targetNode) {
        this.renderCover(targetNode);
      } else {
        this.removeCover();
      }
    } else {
      this.removeCover();
    }
  };

  // 鼠标点击唤醒遮罩层
  handleMouseClick = (e: MouseEvent | TouchEvent) => {
    if (this.isTracking(e) || this.open) {
      if (this.show) {
        // 阻止冒泡
        e.stopPropagation();
        // 阻止默认事件
        e.preventDefault();
        const primaryAction = this.getDefaultAction();
        if (primaryAction !== 'none') {
          this.trackCode(primaryAction as InspectorAction);
        }
        // 清除遮罩层
        this.removeCover();
        if (this.autoToggle) {
          this.open = false;
        }
      }
    }
    if (!e.composedPath().includes(this.nodeTreeRef)) {
      this.removeLayerPanel();
    }
  };

  handleContextMenu = (e: MouseEvent) => {
    if (
      ((this.isTracking(e) && !this.dragging) || this.open) &&
      !this.hoverSwitch
    ) {
      e.preventDefault();
      const nodePath = e.composedPath() as HTMLElement[];
      const nodeTree = this.generateNodeTree(nodePath);

      this.renderLayerPanel(nodeTree, { x: e.clientX, y: e.clientY });
    }
  };

  generateNodeTree = (nodePath: HTMLElement[]): TreeNode => {
    let root: TreeNode;

    let depth = 1;
    let preNode = null;

    for (const element of nodePath.reverse()) {
      const sourceInfo = this.getSourceInfo(element);
      if (!sourceInfo) continue;

      const node: TreeNode = {
        ...sourceInfo,
        children: [],
        depth: depth++,
        element,
      };

      if (preNode) {
        preNode.children.push(node);
      } else {
        root = node;
      }
      preNode = node;
    }

    return root!;
  };

  // disabled 的元素及其子元素无法触发 click 事件
  handlePointerDown = (e: PointerEvent) => {
    let disabled = false;
    let element = e.target as HTMLInputElement;
    while (element) {
      if (element.disabled) {
        disabled = true;
        break;
      }
      element = element.parentElement as HTMLInputElement;
    }
    if (!disabled) {
      return;
    }
    if (this.isTracking(e) || this.open) {
      if (this.show) {
        // 阻止冒泡
        e.stopPropagation();
        // 阻止默认事件
        e.preventDefault();
        // 唤醒 vscode
        this.trackCode();
        // 清除遮罩层
        this.removeCover();
        if (this.autoToggle) {
          this.open = false;
        }
      }
    }
  };

  // 监听键盘抬起，清除遮罩层
  handleKeyUp = (e: KeyboardEvent) => {
    if (!this.isTracking(e) && !this.open) {
      this.removeCover();
    }
  };

  // 打印功能提示信息
  printTip = () => {
    const agent = navigator.userAgent.toLowerCase();
    const isWindows = ['windows', 'win32', 'wow32', 'win64', 'wow64'].some(
      (item) => agent.toUpperCase().match(item.toUpperCase())
    );
    const modeShortcut = isWindows ? 'Shift+Alt+C' : 'Shift+Opt+C';
    const hotKeyMap = isWindows ? WindowsHotKeyMap : MacHotKeyMap;
    const keys = this.hotKeys
      .split(',')
      .map((item) => '%c' + hotKeyMap[item.trim() as keyof typeof hotKeyMap]);
    const colorCount = keys.length * 2 + 1;
    const colors = Array(colorCount)
      .fill('')
      .map((_, index) => {
        if (index % 2 === 0) {
          return 'color: #00B42A; font-family: PingFang SC; font-size: 12px;';
        } else {
          return 'color: #006aff; font-weight: bold; font-family: PingFang SC; font-size: 12px;';
        }
      });
    const replacement = '%c';
    const currentMode = this.getActionLabel(this.getDefaultAction());
    console.log(
      `${replacement}[code-inspector-plugin]${replacement}Press and hold ${keys.join(
        ` ${replacement}+ `
      )}${replacement} to enable the feature. (Current mode: ${currentMode}; press ${modeShortcut} to switch)`,
      'color: #006aff; font-weight: bolder; font-size: 12px;',
      ...colors
    );
  };

  // 获取鼠标位置
  getMousePosition = (e: MouseEvent | TouchEvent) => {
    return {
      x: e instanceof MouseEvent ? e.pageX : e.touches[0]?.pageX,
      y: e instanceof MouseEvent ? e.pageY : e.touches[0]?.pageY,
    };
  };

  // 记录鼠标按下时初始位置
  recordMousePosition = (
    e: MouseEvent | TouchEvent,
    target: 'switch' | 'nodeTree'
  ) => {
    const ref =
      target === 'switch' ? this.inspectorSwitchRef : this.nodeTreeRef;
    this.mousePosition = {
      baseX: ref.offsetLeft,
      baseY: ref.offsetTop,
      moveX: this.getMousePosition(e).x,
      moveY: this.getMousePosition(e).y,
    };
    this.dragging = true;
    this.draggingTarget = target;
    e.preventDefault();
  };

  // 结束拖拽
  handleMouseUp = (e: MouseEvent | TouchEvent) => {
    this.hoverSwitch = false;
    if (this.dragging) {
      this.dragging = false;
      if (e instanceof TouchEvent && this.draggingTarget === 'switch') {
        this.switch(e);
      }
    }
  };

  // 切换开关
  switch = (e: Event) => {
    if (!this.moved) {
      this.open = !this.open;
      e.preventDefault();
      e.stopPropagation();
    }
    this.moved = false;
  };

  handleClickTreeNode = (node: TreeNode) => {
    this.element = node;
    this.trackCode('locate');
    this.removeLayerPanel();
  };

  handleMouseEnterNode = async (e: MouseEvent, node: TreeNode) => {
    const { x, y, width, height } =
      (e.target as HTMLDivElement)!.getBoundingClientRect();
    this.activeNode = {
      width: width - 16 + 'px',
      left: x + 8 + 'px',
      visibility: 'hidden',
      top: `${y - 4}px`,
      bottom: '',
      content: `${node.path}:${node.line}:${node.column}`,
      class: 'tooltip-top',
    };

    this.renderCover(node.element);

    await nextTick();
    const { y: tooltipY } = this.nodeTreeTooltipRef!.getBoundingClientRect();
    if (tooltipY < 0) {
      this.activeNode = {
        ...this.activeNode,
        bottom: '',
        top: `${y + height + 4}px`,
        class: 'tooltip-bottom',
      };
    }
    this.activeNode = {
      ...this.activeNode,
      visibility: 'visible',
    };
  };

  handleMouseLeaveNode = () => {
    this.activeNode = {
      ...this.activeNode,
      visibility: 'hidden',
    };
    this.removeCover(true);
  };

  protected firstUpdated(): void {
    if (!this.hideConsole) {
      this.printTip();
    }
    window.addEventListener('mousemove', this.handleMouseMove, true);
    window.addEventListener('touchmove', this.handleMouseMove, true);
    window.addEventListener('mousemove', this.handleDrag, true);
    window.addEventListener('touchmove', this.handleDrag, true);
    window.addEventListener('click', this.handleMouseClick, true);
    window.addEventListener('pointerdown', this.handlePointerDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);
    window.addEventListener('keydown', this.handleModeShortcut, true);
    window.addEventListener('mouseleave', this.removeCover, true);
    window.addEventListener('mouseup', this.handleMouseUp, true);
    window.addEventListener('touchend', this.handleMouseUp, true);
    window.addEventListener('contextmenu', this.handleContextMenu, true);
  }

  disconnectedCallback(): void {
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    window.removeEventListener('touchmove', this.handleMouseMove, true);
    window.removeEventListener('mousemove', this.handleDrag, true);
    window.removeEventListener('touchmove', this.handleDrag, true);
    window.removeEventListener('click', this.handleMouseClick, true);
    window.removeEventListener('pointerdown', this.handlePointerDown, true);
    window.removeEventListener('keyup', this.handleKeyUp, true);
    window.removeEventListener('keydown', this.handleModeShortcut, true);
    window.removeEventListener('mouseleave', this.removeCover, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('touchend', this.handleMouseUp, true);
    window.removeEventListener('contextmenu', this.handleContextMenu, true);
  }

  renderNodeTree = (node: TreeNode): TemplateResult => html`
    <div
      class="inspector-layer"
      style="padding-left: ${node.depth * 8}px;"
      @mouseenter="${async (e: MouseEvent) =>
        await this.handleMouseEnterNode(e, node)}"
      @mouseleave="${this.handleMouseLeaveNode}"
      @click="${() => this.handleClickTreeNode(node)}"
    >
      &lt;${node.name}&gt;
    </div>
    ${node.children.map((child) => this.renderNodeTree(child))}
  `;

  render() {
    const containerPosition = {
      display: this.show ? 'block' : 'none',
      top: `${this.position.top - this.position.margin.top}px`,
      left: `${this.position.left - this.position.margin.left}px`,
      height: `${
        this.position.bottom -
        this.position.top +
        this.position.margin.bottom +
        this.position.margin.top
      }px`,
      width: `${
        this.position.right -
        this.position.left +
        this.position.margin.right +
        this.position.margin.left
      }px`,
    };
    const marginPosition = {
      borderTopWidth: `${this.position.margin.top}px`,
      borderRightWidth: `${this.position.margin.right}px`,
      borderBottomWidth: `${this.position.margin.bottom}px`,
      borderLeftWidth: `${this.position.margin.left}px`,
    };
    const borderPosition = {
      borderTopWidth: `${this.position.border.top}px`,
      borderRightWidth: `${this.position.border.right}px`,
      borderBottomWidth: `${this.position.border.bottom}px`,
      borderLeftWidth: `${this.position.border.left}px`,
    };
    const paddingPosition = {
      borderTopWidth: `${this.position.padding.top}px`,
      borderRightWidth: `${this.position.padding.right}px`,
      borderBottomWidth: `${this.position.padding.bottom}px`,
      borderLeftWidth: `${this.position.padding.left}px`,
    };

    const nodeTreeStyles = {
      display: this.showNodeTree ? 'flex' : 'none',
      ...this.nodeTreePosition,
    };

    const nodeTooltipStyles = {
      visibility: this.activeNode.visibility,
      maxWidth: this.activeNode.width,
      top: this.activeNode.top,
      left: this.activeNode.left,
      bottom: this.activeNode.bottom,
      display: this.showNodeTree ? '' : 'none',
    };
    const resolvedDefaultAction = this.getDefaultAction();
    const modeLabel = this.getActionLabel(resolvedDefaultAction);
    const modeShortcut =
      typeof navigator !== 'undefined' &&
      /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
        ? 'Shift+Opt+C'
        : 'Shift+Alt+C';

    return html`
      <div
        class="code-inspector-container"
        id="code-inspector-container"
        style=${styleMap(containerPosition)}
      >
        <div class="margin-overlay" style=${styleMap(marginPosition)}>
          <div class="border-overlay" style=${styleMap(borderPosition)}>
            <div class="padding-overlay" style=${styleMap(paddingPosition)}>
              <div class="content-overlay"></div>
            </div>
          </div>
        </div>
        <div
          id="element-info"
          class="element-info ${this.elementTipStyle.vertical} ${this
            .elementTipStyle.horizon} ${this.elementTipStyle.visibility}"
          style=${styleMap({
            width: PopperWidth + 'px',
            maxWidth: '100vw',
            ...this.elementTipStyle.additionStyle,
          })}
        >
          <div class="element-info-content">
            <div class="name-line">
              <div class="element-name">
                <span class="element-title">&lt;${this.element.name}&gt;</span>
                <span class="element-tip">
                  Mode: ${modeLabel} · ${modeShortcut} to switch
                </span>
              </div>
            </div>
            <div class="path-line">
              ${this.element.path}:${this.element.line}:${this.element.column}
            </div>
          </div>
        </div>
      </div>
      <div
        id="inspector-switch"
        class="inspector-switch ${this.open
          ? 'active-inspector-switch'
          : ''} ${this.moved ? 'move-inspector-switch' : ''}"
        style=${styleMap({ display: this.showSwitch ? 'flex' : 'none' })}
        @mousedown="${(e: MouseEvent) => this.recordMousePosition(e, 'switch')}"
        @touchstart="${(e: TouchEvent) =>
          this.recordMousePosition(e, 'switch')}"
        @click="${this.switch}"
      >
        ${this.open
          ? html`
              <svg
                t="1677801709811"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="1110"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                width="1em"
                height="1em"
              >
                <path
                  d="M546.56 704H128c-19.2 0-32-12.8-32-32V256h704v194.56c10.928 1.552 21.648 3.76 32 6.832V128c0-35.2-28.8-64-64-64H128C92.8 64 64 92.8 64 128v544c0 35.2 28.8 64 64 64h425.392a221.936 221.936 0 0 1-6.848-32zM96 128c0-19.2 12.8-32 32-32h640c19.2 0 32 12.8 32 32v96H96V128z"
                  fill="#34495E"
                  p-id="1111"
                ></path>
                <path
                  d="M416 160m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"
                  fill="#00B42A"
                  p-id="1112"
                ></path>
                <path
                  d="M288 160m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"
                  fill="#F7BA1E"
                  p-id="1113"
                ></path>
                <path
                  d="M160 160m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"
                  fill="#F53F3F"
                  p-id="1114"
                ></path>
                <path
                  d="M382.848 658.928l99.376-370.88 30.912 8.272-99.36 370.88zM318.368 319.2L160 477.6l158.4 158.4 22.64-22.624-135.792-135.776 135.776-135.776zM768 480c-13.088 0-25.888 1.344-38.24 3.84l6.24-6.24-158.4-158.4-22.64 22.624 135.792 135.776-135.776 135.776 22.656 22.624 2.208-2.224a190.768 190.768 0 0 0 30.928 148.08l-116.672 116.656c-10.24 10.24-10.24 26.896 0 37.136l27.76 27.76c5.12 5.12 11.84 7.68 18.56 7.68s13.456-2.56 18.56-7.68l120.992-120.96A190.56 190.56 0 0 0 768 864c105.872 0 192-86.128 192-192s-86.128-192-192-192z m-159.12 193.136c0-88.224 71.776-160 160-160 10.656 0 21.04 1.152 31.12 3.152V672c0 19.2-12.8 32-32 32h-156a160.144 160.144 0 0 1-3.12-30.864z m-68.464 263.584l-19.632-19.632 110.336-110.336c6.464 6.656 13.392 12.848 20.752 18.528l-111.456 111.44z m228.464-103.584c-65.92 0-122.576-40.096-147.056-97.136H768c35.2 0 64-28.8 64-64v-145.776c56.896 24.544 96.88 81.12 96.88 146.912 0 88.224-71.776 160-160 160z"
                  fill="#006AFF"
                  p-id="1115"
                ></path>
                <path
                  d="M864.576 672c0 52.928-43.072 96-96 96v32a128 128 0 0 0 128-128h-32z"
                  fill="#34495E"
                  p-id="1116"
                ></path>
              </svg>
            `
          : html`<svg
              t="1677801709811"
              class="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="1110"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              width="1em"
              height="1em"
            >
              <path
                d="M546.56 704H128c-19.2 0-32-12.8-32-32V256h704v194.56c10.928 1.552 21.648 3.76 32 6.832V128c0-35.2-28.8-64-64-64H128C92.8 64 64 92.8 64 128v544c0 35.2 28.8 64 64 64h425.392a221.936 221.936 0 0 1-6.848-32zM96 128c0-19.2 12.8-32 32-32h640c19.2 0 32 12.8 32 32v96H96V128z"
                fill="currentColor"
                p-id="1111"
              ></path>
              <path
                d="M416 160m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"
                fill="currentColor"
                p-id="1112"
              ></path>
              <path
                d="M288 160m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"
                fill="currentColor"
                p-id="1113"
              ></path>
              <path
                d="M160 160m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z"
                fill="currentColor"
                p-id="1114"
              ></path>
              <path
                d="M382.848 658.928l99.376-370.88 30.912 8.272-99.36 370.88zM318.368 319.2L160 477.6l158.4 158.4 22.64-22.624-135.792-135.776 135.776-135.776zM768 480c-13.088 0-25.888 1.344-38.24 3.84l6.24-6.24-158.4-158.4-22.64 22.624 135.792 135.776-135.776 135.776 22.656 22.624 2.208-2.224a190.768 190.768 0 0 0 30.928 148.08l-116.672 116.656c-10.24 10.24-10.24 26.896 0 37.136l27.76 27.76c5.12 5.12 11.84 7.68 18.56 7.68s13.456-2.56 18.56-7.68l120.992-120.96A190.56 190.56 0 0 0 768 864c105.872 0 192-86.128 192-192s-86.128-192-192-192z m-159.12 193.136c0-88.224 71.776-160 160-160 10.656 0 21.04 1.152 31.12 3.152V672c0 19.2-12.8 32-32 32h-156a160.144 160.144 0 0 1-3.12-30.864z m-68.464 263.584l-19.632-19.632 110.336-110.336c6.464 6.656 13.392 12.848 20.752 18.528l-111.456 111.44z m228.464-103.584c-65.92 0-122.576-40.096-147.056-97.136H768c35.2 0 64-28.8 64-64v-145.776c56.896 24.544 96.88 81.12 96.88 146.912 0 88.224-71.776 160-160 160z"
                fill="currentColor"
                p-id="1115"
              ></path>
              <path
                d="M864.576 672c0 52.928-43.072 96-96 96v32a128 128 0 0 0 128-128h-32z"
                fill="currentColor"
                p-id="1116"
              ></path>
            </svg>`}
      </div>
      <div
        id="inspector-node-tree"
        class="element-info-content"
        style=${styleMap(nodeTreeStyles)}
      >
        <div
          class="inspector-layer-title"
          @mousedown="${(e: MouseEvent) =>
            this.recordMousePosition(e, 'nodeTree')}"
          @touchstart="${(e: TouchEvent) =>
            this.recordMousePosition(e, 'nodeTree')}"
        >
          <div>🔍️ click node to open editor</div>
          ${html`<svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="close-icon"
            @click="${this.removeLayerPanel}"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>`}
        </div>

        <div
          class="node-tree-list"
          style="${styleMap({ pointerEvents: this.dragging ? 'none' : '' })}"
        >
          ${this.nodeTree ? this.renderNodeTree(this.nodeTree) : ''}
          <div style="height: 8px"></div>
        </div>
      </div>
      <div
        id="node-tree-tooltip"
        class="${this.activeNode.class}"
        style=${styleMap(nodeTooltipStyles)}
      >
        ${this.activeNode.content}
      </div>
    `;
  }

  static styles = css`
    .code-inspector-container {
      position: fixed;
      pointer-events: none;
      z-index: 9999999999999;
      font-family: 'PingFang SC';
      .margin-overlay {
        position: absolute;
        inset: 0;
        border-style: solid;
        border-color: rgba(255, 155, 0, 0.3);
        .border-overlay {
          position: absolute;
          inset: 0;
          border-style: solid;
          border-color: rgba(255, 200, 50, 0.3);
          .padding-overlay {
            position: absolute;
            inset: 0;
            border-style: solid;
            border-color: rgba(77, 200, 0, 0.3);
            .content-overlay {
              position: absolute;
              inset: 0;
              background: rgba(120, 170, 210, 0.7);
            }
          }
        }
      }
    }
    .element-info {
      position: absolute;
    }
    .element-info.hidden {
      visibility: hidden;
    }
    .element-info-content {
      max-width: 100%;
      font-size: 12px;
      color: #000;
      background-color: #fff;
      word-break: break-all;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
      box-sizing: border-box;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .element-info-top {
      top: -4px;
      transform: translateY(-100%);
    }
    .element-info-bottom {
      top: calc(100% + 4px);
    }
    .element-info-top-inner {
      top: 4px;
    }
    .element-info-bottom-inner {
      bottom: 4px;
    }
    .element-info-left {
      left: 0;
      display: flex;
      justify-content: flex-start;
    }
    .element-info-right {
      right: 0;
      display: flex;
      justify-content: flex-end;
    }
    .element-name .element-title {
      color: coral;
      font-weight: bold;
    }
    .element-name .element-tip {
      color: #006aff;
    }
    .path-line {
      color: #333;
      line-height: 12px;
      margin-top: 4px;
    }
    .inspector-switch {
      position: fixed;
      z-index: 9999999999999;
      top: 50%;
      right: 24px;
      font-size: 22px;
      transform: translateY(-100%);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.8);
      color: #555;
      height: 32px;
      width: 32px;
      border-radius: 50%;
      box-shadow: 0px 1px 2px -2px rgba(0, 0, 0, 0.2),
        0px 3px 6px 0px rgba(0, 0, 0, 0.16),
        0px 5px 12px 4px rgba(0, 0, 0, 0.12);
      cursor: pointer;
    }
    .active-inspector-switch {
      color: #006aff;
    }
    .move-inspector-switch {
      cursor: move;
    }
    #inspector-node-tree {
      position: fixed;
      user-select: none;
      z-index: 9999999999999999;
      min-width: 300px;
      max-width: min(max(30vw, 300px), 400px);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        'Liberation Mono', 'Courier New', monospace;
      display: flex;
      flex-direction: column;
      padding: 0;

      .inspector-layer-title {
        border-bottom: 1px solid #eee;
        padding: 8px 8px 4px;
        margin-bottom: 8px;
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
        &:hover {
          background: rgba(0, 106, 255, 0.1);
        }
      }

      .node-tree-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .inspector-layer {
        cursor: pointer;
        position: relative;
        padding-right: 8px;
        &:hover {
          background: #fdf4bf;
        }
      }

      .element-tip {
        font-size: 9px;
        opacity: 0.5;
        color: #999;
        margin-left: 6px;
      }

      .path-line {
        font-size: 9px;
        color: #777;
        margin-top: 1px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }
    }

    #node-tree-tooltip {
      position: fixed;
      box-sizing: border-box;
      z-index: 999999999999999999;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      white-space: wrap;
      pointer-events: none;
      word-break: break-all;
    }
    .tooltip-top {
      transform: translateY(-100%);
    }
    .close-icon {
      cursor: pointer;
    }
  `;
}

if (!customElements.get('code-inspector-component')) {
  customElements.define('code-inspector-component', CodeInspectorComponent);
}
