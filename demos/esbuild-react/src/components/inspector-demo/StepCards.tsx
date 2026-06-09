import * as React from 'react';

const steps = [
  [
    '01',
    'Hold down the keys',
    'Hold down the keys to make the plugin enter a inspection state.',
  ],
  ['02', 'Move the mouse', 'Move to any  to view the element mask prompt.'],
  [
    '03',
    'Click the element',
    'Clicking the element will automatically open the IDE and locate to the source code position.',
  ],
];

export function StepCards() {
  return (
    <div style={gridStyle}>
      {steps.map(([index, title, text]) => (
        <article key={index} style={cardStyle}>
          <span style={indexStyle}>{index}</span>
          <h2 style={titleStyle}>{title}</h2>
          <p style={textStyle}>{text}</p>
        </article>
      ))}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  marginTop: 28,
};

const cardStyle: React.CSSProperties = {
  minHeight: 168,
  padding: 20,
  border: '1px solid #dfe8e5',
  borderRadius: 8,
  background: 'rgba(255, 255, 255, 0.9)',
  boxShadow: '0 16px 40px rgba(23, 32, 47, 0.08)',
};

const indexStyle: React.CSSProperties = {
  color: '#b7791f',
  fontSize: 12,
  fontWeight: 800,
};

const titleStyle: React.CSSProperties = {
  margin: '12px 0 8px',
  color: '#17202f',
  fontSize: 20,
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#5b6472',
  lineHeight: 1.7,
};
