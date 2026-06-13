import * as React from 'react';
import { DemoHero } from './components/inspector-demo/DemoHero';
import { ShortcutPanel } from './components/inspector-demo/ShortcutPanel';
import { StepCards } from './components/inspector-demo/StepCards';
import { TryTargets } from './components/inspector-demo/TryTargets';

export default function App() {
  return (
    <main style={pageStyle}>
      <style>
        {`
          html, body, #root {
            min-width: 320px;
            min-height: 100vh;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }
        `}
      </style>
      <section style={shellStyle}>
        <DemoHero />
        <ShortcutPanel />
        <StepCards />
        <TryTargets />
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  boxSizing: 'border-box',
  color: '#17202f',
  background: 'linear-gradient(135deg, #f7f9fc 0%, #eef6f3 48%, #fff7e8 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shellStyle: React.CSSProperties = {
  width: 'min(1040px, 100%)',
};
