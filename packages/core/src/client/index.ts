import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { composedPath } from './util';
import { PathName } from '../shared/constant';

const styleId = '__code-inspector-unique-id';

@customElement('code-inspector-component')
export class MyElement extends LitElement {
  @property()
  hotKeys: string = 'shiftKey,altKey';
  @property()
  port: number = 6666;
  @property()
  hideSwitch: boolean = false;
  @property()
  autoToggle: boolean = false;

  @state()
  position = { top: 0, left: 0, width: 0, height: 0 }; // 弹窗位置
  @state()
  element = { name: '', line: 0, column: 0, path: '' }; // 选中节点信息
  @state()
  infoClassName = { vertical: '', horizon: '' }; // 信息浮块位置类名
  @state()
  infoWidth = '300px';
  @state()
  show = false; // 是否展示
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

  @query('#inspector-switch')
  inspectorSwitchRef!: HTMLDivElement;

  isTracking = (e: any) => {
    return (
      this.hotKeys && this.hotKeys.split(',').every((key) => e[key.trim()])
    );
  };

  // 渲染遮罩层
  renderCover = (target: HTMLElement) => {
    // 设置 target 的位置
    const { top, left, height, width } = target.getBoundingClientRect();
    this.position = { top, left, width, height };
    const browserHeight = document.documentElement.clientHeight; // 浏览器高度
    const browserWidth = document.documentElement.clientWidth; // 浏览器宽度
    // 自动调整信息弹出位置
    const bottomToViewPort = browserHeight - top - height; // 距浏览器视口底部距离
    const rightToViewPort = browserWidth - left - width; // 距浏览器右边距离
    this.infoClassName = {
      vertical:
        top > bottomToViewPort
          ? top < 100
            ? 'element-info-top-inner'
            : 'element-info-top'
          : bottomToViewPort < 100
          ? 'element-info-bottom-inner'
          : 'element-info-bottom',
      horizon:
        left >= rightToViewPort ? 'element-info-right' : 'element-info-left',
    };
    this.infoWidth =
      Math.min(Math.max(left + width - 4, rightToViewPort + width - 4), 300) +
      'px';
    // 增加鼠标光标样式
    this.addGlobalCursorStyle();
    // 获取元素信息
    const paths = target.getAttribute(PathName) || '';
    const [path, _line, _column, name] = paths.split(':');
    const line = Number(_line);
    const column = Number(_column);
    this.element = { name, path, line, column };
    this.show = true;
  };

  removeCover = () => {
    this.show = false;
    this.removeGlobalCursorStyle();
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

  // 请求本地服务端，打开vscode
  trackCode = () => {
    const url = `http://localhost:${this.port}/?file=${this.element.path}&line=${this.element.line}&column=${this.element.column}`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
  };

  // 移动按钮
  moveSwitch = (e: MouseEvent) => {
    if (composedPath(e).includes(this.inspectorSwitchRef)) {
      this.hoverSwitch = true;
    } else {
      this.hoverSwitch = false;
    }
    // 判断是否在拖拽按钮
    if (this.dragging) {
      this.moved = true;
      this.inspectorSwitchRef.style.left =
        this.mousePosition.baseX + (e.pageX - this.mousePosition.moveX) + 'px';
      this.inspectorSwitchRef.style.top =
        this.mousePosition.baseY + (e.pageY - this.mousePosition.moveY) + 'px';
      return;
    }
  };

  // 鼠标移动渲染遮罩层位置
  handleMouseMove = (e: MouseEvent) => {
    if (
      ((this.isTracking(e) && !this.dragging) || this.open) &&
      !this.hoverSwitch
    ) {
      const nodePath = composedPath(e);
      let targetNode;
      // 寻找第一个有_vc-path属性的元素
      for (let i = 0; i < nodePath.length; i++) {
        const node = nodePath[i];
        if (node.hasAttribute && node.hasAttribute(PathName)) {
          targetNode = node;
          break;
        }
      }
      if (targetNode) {
        this.renderCover(targetNode);
      }
    } else {
      this.removeCover();
    }
  };

  // 鼠标点击唤醒遮罩层
  handleMouseClick = (e: any) => {
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
  handleKeyUp = (e: any) => {
    if (!this.isTracking(e) && !this.open) {
      this.removeCover();
    }
  };

  // 打印功能提示信息
  printTip = () => {
    console.log(
      `%c同时按住 [${this.hotKeys
        .split(',')
        .join(' + ')}] 时启用 inspector 功能(点击页面元素可定位至编辑器源代码)`,
      'color: #42b983; font-weight: bold; font-family: PingFang SC;'
    );
  };

  // 记录鼠标按下时初始位置
  recordMousePosition = (e: MouseEvent) => {
    this.mousePosition = {
      baseX: this.inspectorSwitchRef.offsetLeft,
      baseY: this.inspectorSwitchRef.offsetTop,
      moveX: e.pageX,
      moveY: e.pageY,
    };
    this.dragging = true;
    e.preventDefault();
  };

  // 结束拖拽
  handleMouseUp = () => {
    this.dragging = false;
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

  protected firstUpdated(): void {
    this.printTip();
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousemove', this.moveSwitch);
    window.addEventListener('click', this.handleMouseClick, true);
    document.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mouseleave', this.removeCover);
    document.addEventListener('mouseup', this.handleMouseUp);
    this.inspectorSwitchRef.addEventListener(
      'mousedown',
      this.recordMousePosition
    );
    this.inspectorSwitchRef.addEventListener('click', this.switch);
  }

  disconnectedCallback(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousemove', this.moveSwitch);
    window.removeEventListener('click', this.handleMouseClick, true);
    document.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mouseleave', this.removeCover);
    document.removeEventListener('mouseup', this.handleMouseUp);
    this.inspectorSwitchRef &&
      this.inspectorSwitchRef.removeEventListener(
        'mousedown',
        this.recordMousePosition
      );
    this.inspectorSwitchRef.removeEventListener('click', this.switch);
  }

  render() {
    const containerPosition = {
      left: `${this.position.left}px`,
      top: `${this.position.top}px`,
      width: `${this.position.width}px`,
      height: `${this.position.height}px`,
      display: this.show ? 'block' : 'none',
    };
    return html`
      <div
        class="code-inspector-container"
        id="code-inspector-container"
        style=${styleMap(containerPosition)}
      >
        <div
          id="element-info"
          class="element-info ${this.infoClassName.vertical} ${this
            .infoClassName.horizon}"
          style=${styleMap({ width: this.infoWidth })}
        >
          <div class="element-info-content">
            <div class="name-line">
              <div class="element-name">
                <span class="element-title">${this.element.name}</span>
                <span class="element-tip">click to open editor</span>
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
        style=${styleMap({ display: this.hideSwitch ? 'none' : 'flex' })}
      >
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
        </svg>
      </div>
    `;
  }

  static styles = css`
    .code-inspector-container {
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      background: rgba(0, 106, 255, 0.3);
    }
    .element-info {
      position: absolute;
    }
    .element-info-content {
      max-width: 100%;
      font-size: 12px;
      color: #000;
      background-color: #fff;
      word-break: break-all;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
      box-sizing: border-box;
      padding: 4px;
    }
    .element-info-top {
      top: 0;
      transform: translateY(-100%);
    }
    .element-info-bottom {
      top: 100%;
    }
    .element-info-top-inner {
      top: 0;
    }
    .element-info-bottom-inner {
      bottom: 0;
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
      color: #999;
    }
    .path-line {
      color: #333;
      line-height: 12px;
      margin-top: 4px;
    }
    .inspector-switch {
      position: fixed;
      z-index: 9999999;
      top: 16px;
      left: 50%;
      font-size: 20px;
      transform: translateX(-50%);
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
      color: #41b883;
    }
    .move-inspector-switch {
      cursor: move;
    }
  `;
}
