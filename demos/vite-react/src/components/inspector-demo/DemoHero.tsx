export function DemoHero() {
  return (
    <div>
      <p className="inspector-badge">code-inspector-plugin demo</p>
      <div className="inspector-hero">
        <h1 id="inspector-title">按住组合键体验源码定位</h1>
        <p>
          在页面上按住默认组合键并移动鼠标，DOM 元素会显示定位遮罩；
          点击任意元素即可打开 IDE 并定位到对应源码。
        </p>
      </div>
    </div>
  );
}
