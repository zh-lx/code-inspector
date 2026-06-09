import * as React from 'react';

export function DemoHero() {
  return (
    <div>
      <p style={badgeStyle}>code-inspector-plugin demo</p>
      <div style={heroStyle}>
        <h1 style={titleStyle}>按住组合键体验源码定位</h1>
        <p style={textStyle}>
          在页面上按住默认组合键并移动鼠标，DOM 元素会显示定位遮罩；
          点击任意元素即可打开 IDE 并定位到对应源码。
        </p>
      </div>
    </div>
  );
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  margin: '0 0 18px',
  padding: '6px 10px',
  border: '1px solid #b9d8d2',
  borderRadius: 999,
  color: '#1c6b73',
  background: '#ffffff',
  fontSize: 13,
  fontWeight: 700,
};

const heroStyle: React.CSSProperties = { maxWidth: 760 };

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 'clamp(36px, 6vw, 64px)',
  lineHeight: 1.05,
};

const textStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: '18px 0 0',
  color: '#4b5563',
  fontSize: 18,
  lineHeight: 1.8,
};
