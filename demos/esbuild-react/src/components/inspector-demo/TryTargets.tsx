import * as React from 'react';

export function TryTargets() {
  return (
    <div style={containerStyle}>
      <button type="button" style={targetStyle}>
        测试按钮
      </button>
      <span style={targetStyle}>文本节点</span>
      <a href="#root" style={targetStyle}>
        锚点元素
      </a>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 22,
};

const targetStyle: React.CSSProperties = {
  minHeight: 44,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 16px',
  border: '1px solid #cad8d4',
  borderRadius: 8,
  color: '#17202f',
  background: '#ffffff',
  font: 'inherit',
  fontWeight: 700,
  textDecoration: 'none',
};
