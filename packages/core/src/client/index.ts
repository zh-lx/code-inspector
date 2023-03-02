import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { debounce, composedPath } from './util';
import { NodeName, PathName, LineName, ColumnName } from '../shared/constant';

const styleId = '__vue-inspector-unique-id';

@customElement('vue-inspector-component')
export class MyElement extends LitElement {
  @property()
  hotKeys: string = 'shiftKey,altKey';
  @property()
  port: number = 6666;

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

  isTracking = (e: any) => {
    return this.hotKeys.split(',').every((key) => e[key.trim()]);
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
    const path = target.getAttribute(PathName) || '';
    const name = target.getAttribute(NodeName) || '';
    const line = Number(target.getAttribute(LineName) || 0);
    const column = Number(target.getAttribute(ColumnName) || 0);
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

  // 鼠标移动渲染遮罩层位置
  handleMouseMove = debounce((e: MouseEvent) => {
    if (this.isTracking(e)) {
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
    }
  }, 20);

  // 鼠标点击唤醒遮罩层
  handleMouseClick = (e: any) => {
    if (this.isTracking(e)) {
      if (this.show) {
        // 阻止冒泡
        e.stopPropagation();
        // 阻止默认事件
        e.preventDefault();
        // 唤醒 vscode
        this.trackCode();
        // 清除遮罩层
        this.removeCover();
      }
    }
  };

  // 监听键盘抬起，清除遮罩层
  handleKeyUp = (e: any) => {
    if (!this.isTracking(e)) {
      this.removeCover();
    }
  };

  protected firstUpdated(): void {
    console.log(
      `%c按住 【${this.hotKeys
        .split(',')
        .join(' + ')}】 启用 inspector 功能(点击页面元素可定位至编辑器源代码)`,
      'color: blue; font-weight: bold;'
    );
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('click', this.handleMouseClick, true);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mouseleave', this.removeCover);
  }

  disconnectedCallback(): void {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('click', this.handleMouseClick, true);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mouseleave', this.removeCover);
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
        class="vue-inspector-container"
        id="vue-inspector-container"
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
    `;
  }

  static styles = css`
    .vue-inspector-container {
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      background: rgba(32, 114, 205, 0.5);
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
  `;
}
