import * as React from 'react';

export function ShortcutPanel() {
  return (
    <div style={containerStyle}>
      <Shortcut platform="Mac" keys={['Option', 'Shift']} />
      <Shortcut platform="Windows" keys={['Alt', 'Shift']} />
    </div>
  );
}

function Shortcut({ platform, keys }: { platform: string; keys: string[] }) {
  return (
    <div style={shortcutStyle}>
      <span style={platformStyle}>{platform}</span>
      {keys.map((key) => (
        <kbd key={key} style={keyStyle}>
          {key}
        </kbd>
      ))}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 28,
};

const shortcutStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  border: '1px solid #d7e1df',
  borderRadius: 8,
  background: 'rgba(255, 255, 255, 0.84)',
};

const platformStyle: React.CSSProperties = {
  color: '#667085',
  fontSize: 13,
  fontWeight: 700,
};

const keyStyle: React.CSSProperties = {
  minWidth: 54,
  padding: '6px 10px',
  borderRadius: 6,
  color: '#ffffff',
  background: '#17202f',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  textAlign: 'center',
};
