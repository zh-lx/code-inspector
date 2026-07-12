<script setup lang="ts">
import DemoHero from './components/inspector-demo/DemoHero.vue';
import ShortcutPanel from './components/inspector-demo/ShortcutPanel.vue';
import StepCards from './components/inspector-demo/StepCards.vue';
import TryTargets from './components/inspector-demo/TryTargets.vue';
</script>

<template>
  <main class="inspector-demo">
    <section class="inspector-shell" aria-labelledby="inspector-title">
      <DemoHero />
      <ShortcutPanel />
      <StepCards />
      <TryTargets />
    </section>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  color: #17202f;
  background: #f7f9fc;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

html,
body,
#app,
#root {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
a {
  font: inherit;
}

.inspector-demo {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background:
    radial-gradient(circle at top left, rgba(30, 126, 138, 0.16), transparent 32%),
    linear-gradient(135deg, #f7f9fc 0%, #eef6f3 48%, #fff7e8 100%);
}

.inspector-shell {
  width: min(1040px, 100%);
}

.inspector-badge {
  display: inline-flex;
  margin: 0 0 18px;
  padding: 6px 10px;
  border: 1px solid #b9d8d2;
  border-radius: 999px;
  color: #1c6b73;
  background: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.inspector-hero {
  max-width: 760px;
}

.inspector-hero h1 {
  margin: 0;
  color: #111827;
  font-size: clamp(36px, 6vw, 64px);
  line-height: 1.05;
  letter-spacing: 0;
}

.inspector-hero p {
  margin: 18px 0 0;
  color: #4b5563;
  font-size: 18px;
  line-height: 1.8;
}

.inspector-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.inspector-shortcut {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #d7e1df;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.84);
}

.inspector-shortcut span {
  color: #667085;
  font-size: 13px;
  font-weight: 700;
}

.inspector-shortcut kbd {
  min-width: 54px;
  padding: 6px 10px;
  border-radius: 6px;
  color: #ffffff;
  background: #17202f;
  box-shadow: inset 0 -2px 0 rgba(255, 255, 255, 0.16);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.inspector-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.inspector-card {
  min-height: 168px;
  padding: 20px;
  border: 1px solid #dfe8e5;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 40px rgba(23, 32, 47, 0.08);
}

.inspector-card span {
  color: #b7791f;
  font-size: 12px;
  font-weight: 800;
}

.inspector-card h2 {
  margin: 12px 0 8px;
  color: #17202f;
  font-size: 20px;
}

.inspector-card p {
  margin: 0;
  color: #5b6472;
  line-height: 1.7;
}

.inspector-targets {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.inspector-targets button,
.inspector-targets span,
.inspector-targets a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid #cad8d4;
  border-radius: 8px;
  color: #17202f;
  background: #ffffff;
  font: inherit;
  font-weight: 700;
  text-decoration: none;
}

.inspector-targets button {
  cursor: pointer;
}

@media (max-width: 760px) {
  .inspector-demo {
    padding: 32px 16px;
  }

  .inspector-grid {
    grid-template-columns: 1fr;
  }
}
</style>
