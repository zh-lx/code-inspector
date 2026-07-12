import * as React from 'react';

export function DemoHero() {
  return (
    <div>
      <p style={badgeStyle}>code-inspector-plugin demo</p>
      <div style={heroStyle}>
        <h1 style={titleStyle}>Hold down the keys to locate code</h1>
        <p style={textStyle}>
          Hold down the keys on the page and move the mouse, and the DOM element
          will display a positioning mask; click the element will open the
          IDE{' '}
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
