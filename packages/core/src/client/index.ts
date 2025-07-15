import { LitElement, css, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { PathName, DefaultPort } from '../shared';
import { formatOpenPath } from 'launch-ide';

const styleId = '__code-inspector-unique-id';

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
  copy: boolean | string = false;
  @property()
  target: string = '';
  @property()
  ip: string = 'localhost';
  @property()
  disableServer: boolean = false;

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
  infoClassName = { vertical: '', horizon: '' }; // 信息浮块位置类名
  @state()
  infoWidth = '300px';
  @state()
  show = false; // 是否展示
  @state()
  showLayerPanel = false; // 是否展示图层面板
  @state()
  layerPanelPosition: LayerPosition = {}; // 图层面板位置
  @state()
  elementTree: any[] = []; // 节点树
  @state()
  dragging = false; // 是否正在拖拽中
  @state()
  mousePosition = { baseX: 0, baseY: 0, moveX: 0, moveY: 0 };
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

  @query('#inspector-switch')
  inspectorSwitchRef!: HTMLDivElement;

  @query('#inspector-layers')
  inspectorLayersRef!: HTMLDivElement;

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

  // 渲染遮罩层
  renderCover = (target: HTMLElement) => {
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
    const browserHeight = document.documentElement.clientHeight; // 浏览器高度
    const browserWidth = document.documentElement.clientWidth; // 浏览器宽度
    // 自动调整信息弹出位置
    const bottomToViewPort =
      browserHeight -
      bottom -
      this.getDomPropertyValue(target, 'margin-bottom'); // 距浏览器视口底部距离
    const rightToViewPort =
      browserWidth - right - this.getDomPropertyValue(target, 'margin-right'); // 距浏览器右边距离
    const topToViewPort = top - this.getDomPropertyValue(target, 'margin-top');
    const leftToViewPort =
      left - this.getDomPropertyValue(target, 'margin-left');
    this.infoClassName = {
      vertical:
        topToViewPort > bottomToViewPort
          ? topToViewPort < 100
            ? 'element-info-top-inner'
            : 'element-info-top'
          : bottomToViewPort < 100
            ? 'element-info-bottom-inner'
            : 'element-info-bottom',
      horizon:
        leftToViewPort >= rightToViewPort
          ? 'element-info-right'
          : 'element-info-left',
    };
    this.infoWidth =
      Math.max(
        right -
        left +
        this.getDomPropertyValue(target, 'margin-right') +
        this.getDomPropertyValue(target, 'margin-left'),
        Math.min(300, Math.max(leftToViewPort, rightToViewPort)),
      ) + 'px';
    // 增加鼠标光标样式
    this.addGlobalCursorStyle();
    // 防止 select
    if (!this.preUserSelect) {
      this.preUserSelect = getComputedStyle(document.body).userSelect;
    }
    document.body.style.userSelect = 'none';
    // 获取元素信息
    let paths = target.getAttribute(PathName) || (target as CodeInspectorHtmlElement)[PathName] || '';
    // Todo: transform astro inside
    if (!paths && target.getAttribute('data-astro-source-file')) {
      paths = `${target.getAttribute(
        'data-astro-source-file'
      )}:${target.getAttribute(
        'data-astro-source-loc'
      )}:${target.tagName.toLowerCase()}`;
    }
    const segments = paths.split(':');
    const name = segments[segments.length - 1];
    const column = Number(segments[segments.length - 2]);
    const line = Number(segments[segments.length - 3]);
    const path = segments.slice(0, segments.length - 3).join(':');
    this.element = { name, path, line, column };
    this.show = true;
  };

  removeCover = () => {
    this.show = false;
    this.removeGlobalCursorStyle();
    document.body.style.userSelect = this.preUserSelect;
    this.preUserSelect = '';
  };
  // MARK: 渲染图层面板
  renderLayerPanel = (nodeTree: NodeParseResult[], { x, y }: { x: number; y: number; }) => {

    const browserWidth = document.documentElement.clientWidth;
    const browserHeight = document.documentElement.clientHeight;

    const rightToViewPort = browserWidth - x;
    const bottomToViewPort = browserHeight - y;
    let position: LayerPosition = {};
    if (rightToViewPort < 300) {
      position['right'] = rightToViewPort + 'px';
    } else {
      position['left'] = x + 'px';
    }

    if (bottomToViewPort < 400) {
      position['bottom'] = bottomToViewPort + 'px';
    } else {
      position['top'] = y + 'px';
    }
    this.layerPanelPosition = position;
    this.elementTree = nodeTree;
    this.showLayerPanel = true;
  }
  removeLayerPanel = () => {
    this.showLayerPanel = false;
    this.elementTree = [];
  }

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
    const { path, line, column } = this.element;
    const replacements: Record<string, string | number> = {
      "{file}": path,
      "{line}": line,
      "{column}": column,
    };

    const targetUrl = this.target.replace(
      /\{file\}|\{line\}|\{column\}/g,
      (matched) => String(replacements[matched])
    );
    return targetUrl;
  };

  // 触发功能的处理
  trackCode = () => {
    if (this.target) {
      window.open(this.buildTargetUrl(), "_blank");
    }
    if (this.locate && !this.disableServer) {
      // 请求本地服务端，打开vscode
      if (this.sendType === "xhr") {
        this.sendXHR();
      } else {
        this.sendImg();
      }
    }
    if (this.copy) {
      const path = formatOpenPath(
        this.element.path,
        String(this.element.line),
        String(this.element.column),
        this.copy
      );
      this.copyToClipboard(path[0]);
    }
  };

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
  moveSwitch = (e: MouseEvent | TouchEvent) => {
    if (e.composedPath().includes(this)) {
      this.hoverSwitch = true;
    } else {
      this.hoverSwitch = false;
    }
    // 判断是否在拖拽按钮
    if (this.dragging) {
      this.moved = true;
      this.inspectorSwitchRef.style.left =
        this.mousePosition.baseX + (this.getMousePosition(e).x - this.mousePosition.moveX) + 'px';
      this.inspectorSwitchRef.style.top =
        this.mousePosition.baseY + (this.getMousePosition(e).y - this.mousePosition.moveY) + 'px';
      return;
    }
  };

  isSamePositionNode = (node1: HTMLElement, node2: HTMLElement) => {
    const node1Rect = node1.getBoundingClientRect();
    const node2Rect = node2.getBoundingClientRect();
    return node1Rect.top === node2Rect.top && node1Rect.left === node2Rect.left && node1Rect.right === node2Rect.right && node1Rect.bottom === node2Rect.bottom;
  };

  // 鼠标移动渲染遮罩层位置
  handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (
      ((this.isTracking(e) && !this.dragging) || this.open) &&
      !this.hoverSwitch
    ) {
      const nodePath = e.composedPath() as HTMLElement[];
      let targetNode;
      // 寻找第一个有 data-insp-path 属性的元素
      for (let i = 0; i < nodePath.length; i++) {
        const node = nodePath[i];
        if ((node.hasAttribute && node.hasAttribute(PathName)) || node[PathName]) {
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
        // 唤醒 vscode
        this.trackCode();
        // 清除遮罩层
        this.removeCover();
        if (this.autoToggle) {
          this.open = false;
        }
      }
    }
    // 点击任意地方关闭图层面板。因为事件用了capture，所以需要延迟执行
    setTimeout(() => {
      this.removeLayerPanel();
    });
  };

  handleContextMenu = (e: MouseEvent) => {
    if (
      ((this.isTracking(e) && !this.dragging) || this.open) &&
      !this.hoverSwitch
    ) {
      e.preventDefault();
      const nodePath = e.composedPath() as HTMLElement[];
      const nodeTree = this.generateNodeTree(nodePath);


      this.renderLayerPanel(nodeTree, { x: e.pageX, y: e.pageY });
    }
  }

  generateNodeTree = (nodePath: HTMLElement[]) => {
    let pointer = null;
    let results = [];
    for (let i = 0; i < nodePath.length; i++) {
      const node = this.parseNode(nodePath[i]);
      if (!node.isTrackNode) continue;
      if (!pointer) {
        pointer = node;
        continue;
      }
      if (pointer.rect === node.rect) {
        pointer = node;
        continue;
      }
      if (pointer.path !== node.path) {
        results.push(pointer);
        pointer = node;
      }
    }
    pointer && results.push(pointer);
    return results;
  }

  /**
   * MARK: 解析节点信息
   */
  parseNode = (node: HTMLElement): NodeParseResult => {
    let paths = node.getAttribute?.(PathName) || (node as CodeInspectorHtmlElement)[PathName] || '';
    // Todo: transform astro inside
    if (!paths && node.getAttribute?.('data-astro-source-file')) {
      paths = `${node.getAttribute?.(
        'data-astro-source-file'
      )}:${node.getAttribute?.(
        'data-astro-source-loc'
      )}:${node.tagName.toLowerCase()}`;
    }
    if (!paths) {
      return {
        isTrackNode: false,
      }
    }

    const segments = paths.split(':');
    const name = segments[segments.length - 1];
    const column = Number(segments[segments.length - 2]);
    const line = Number(segments[segments.length - 3]);
    const path = segments.slice(0, segments.length - 3).join(':');
    const { top, right, bottom, left } = node.getBoundingClientRect();

    return {
      isTrackNode: true,
      isAstroNode: !!node.getAttribute('data-astro-source-file'),
      originNode: node,
      rect: `${top},${right},${bottom},${left}`,
      name,
      path,
      line,
      column,
    }
  }

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
    const hotKeyMap = isWindows ? WindowsHotKeyMap : MacHotKeyMap;
    const keys = this.hotKeys
      .split(',')
      .map((item) => '%c' + hotKeyMap[item.trim() as keyof typeof hotKeyMap]);
    const colorCount = keys.length * 2 + 1;
    const colors = Array(colorCount)
      .fill('')
      .map((_, index) => {
        if (index % 2 === 0) {
          return 'color: #42b983; font-family: PingFang SC;';
        } else {
          return 'color: #006aff; font-weight: bold; font-family: PingFang SC;';
        }
      });
    console.log(
      `%c[code-inspector-plugin]%c同时按住 ${keys.join(
        ' %c+ '
      )}%c 时启用功能(点击页面元素可定位至编辑器源代码)`,
      'color: #006aff; font-weight: bolder;',
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
  recordMousePosition = (e: MouseEvent | TouchEvent) => {
    this.mousePosition = {
      baseX: this.inspectorSwitchRef.offsetLeft,
      baseY: this.inspectorSwitchRef.offsetTop,
      moveX: this.getMousePosition(e).x,
      moveY: this.getMousePosition(e).y,
    };
    this.dragging = true;
    e.preventDefault();
  };

  // 结束拖拽
  handleMouseUp = (e: MouseEvent | TouchEvent) => {
    this.hoverSwitch = false;
    if (this.dragging) {
      this.dragging = false;
      if (e instanceof TouchEvent) {
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

  // MARK: 点击图层面板
  handleLayerPanelClick = (e: MouseEvent) => {
    const target = e.target as HTMLDivElement;
    if (!target?.classList?.contains('inspector-layer') || !target?.dataset?.index) {
      return;
    }
    e.stopPropagation()
    const index = +target.dataset.index;
    const node = this.elementTree?.[index];
    if (!node) {
      return;
    }
    this.element = {
      name: node.name,
      column: node.column,
      line: node.line,
      path: node.path,
    }
    this.trackCode();
    this.removeLayerPanel();
  }

  protected firstUpdated(): void {
    if (!this.hideConsole) {
      this.printTip();
    }
    window.addEventListener('mousemove', this.handleMouseMove, true);
    window.addEventListener('touchmove', this.handleMouseMove, true);
    window.addEventListener('mousemove', this.moveSwitch, true);
    window.addEventListener('touchmove', this.moveSwitch, true);
    window.addEventListener('click', this.handleMouseClick, true);
    window.addEventListener('pointerdown', this.handlePointerDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);
    window.addEventListener('mouseleave', this.removeCover, true);
    window.addEventListener('mouseup', this.handleMouseUp, true);
    window.addEventListener('touchend', this.handleMouseUp, true);
    window.addEventListener('contextmenu', this.handleContextMenu, true);
    this.inspectorSwitchRef.addEventListener(
      'mousedown',
      this.recordMousePosition
    );
    this.inspectorSwitchRef.addEventListener(
      'touchstart',
      this.recordMousePosition
    );
    this.inspectorSwitchRef.addEventListener('click', this.switch);
    this.inspectorLayersRef.addEventListener('click', this.handleLayerPanelClick);
  }

  disconnectedCallback(): void {
    window.removeEventListener('mousemove', this.handleMouseMove, true);
    window.removeEventListener('touchmove', this.handleMouseMove, true);
    window.removeEventListener('mousemove', this.moveSwitch, true);
    window.removeEventListener('touchmove', this.moveSwitch, true);
    window.removeEventListener('click', this.handleMouseClick, true);
    window.removeEventListener('pointerdown', this.handlePointerDown, true);
    window.removeEventListener('keyup', this.handleKeyUp, true);
    window.removeEventListener('mouseleave', this.removeCover, true);
    window.removeEventListener('mouseup', this.handleMouseUp, true);
    window.removeEventListener('touchend', this.handleMouseUp, true);
    window.removeEventListener('contextmenu', this.handleContextMenu, true);
    if (this.inspectorSwitchRef) {
      this.inspectorSwitchRef.removeEventListener(
        'mousedown',
        this.recordMousePosition
      );
      this.inspectorSwitchRef.removeEventListener(
        'touchstart',
        this.recordMousePosition
      );
      this.inspectorSwitchRef.removeEventListener('click', this.switch);
    }
    if (this.inspectorLayersRef) {
      this.inspectorLayersRef.removeEventListener('click', this.handleLayerPanelClick);
    }
  }

  render() {
    const containerPosition = {
      display: this.show ? 'block' : 'none',
      top: `${this.position.top - this.position.margin.top}px`,
      left: `${this.position.left - this.position.margin.left}px`,
      height: `${this.position.bottom -
        this.position.top +
        this.position.margin.bottom +
        this.position.margin.top
        }px`,
      width: `${this.position.right -
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

    const layerPanelPosition = {
      display: this.showLayerPanel ? 'block' : 'none',
      ...this.layerPanelPosition,
    }
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
          class="element-info ${this.infoClassName.vertical} ${this
        .infoClassName.horizon}"
          style=${styleMap({ width: this.infoWidth })}
        >
          <div class="element-info-content">
            <div class="name-line">
              <div class="element-name">
                <span class="element-title">&lt;${this.element.name}&gt;</span>
                <span class="element-tip">click to open IDE</span>
              </div>
            </div>
            <div class="path-line">${this.element.path}</div>
          </div>
        </div>
      </div>
      <div
        id="inspector-switch"
        class="inspector-switch ${this.open
        ? 'active-inspector-switch'
        : ''} ${this.moved ? 'move-inspector-switch' : ''}"
        style=${styleMap({ display: this.showSwitch ? 'flex' : 'none' })}
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
      <div id="inspector-layers" style=${styleMap(layerPanelPosition)}>
        ${this.elementTree.map((node, i) => html`<div class="inspector-layer" data-index=${i}>
          <div class="name-line">
            <div class="element-name">
              <span class="element-title">&lt;${node.name}&gt;</span>
              <span class="element-tip">click to open IDE</span>
            </div>
          </div>
          <div class="path-line">${node.path}</div>
        </div>
      `)}
      </div>`;
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
    .element-info-content, #inspector-layers {
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
    #inspector-layers {
      padding: 8px;
      position: fixed;
      user-select: none;
      background-color: #fff;
      z-index: 9999999999999;
      border-radius: 8px;

      .inspector-layer {
        cursor: pointer;
        pointer-events: auto;
        border-radius: 4px;
        padding: 8px;
      }
      .inspector-layer * {
        pointer-events: none;
      }
      .inspector-layer:hover {
        background-color: #f0f0f0;
      }
      .inspector-layer:first-child {
        background-color: #6cf;
      }
    }
  `;
}

if (!customElements.get('code-inspector-component')) {
  customElements.define('code-inspector-component', CodeInspectorComponent);
}
