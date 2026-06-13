<script setup lang="ts">
import DemoHero from './components/inspector-demo/DemoHero.[test].vue';
import ShortcutPanel from './components/inspector-demo/ShortcutPanel.jsx';
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
