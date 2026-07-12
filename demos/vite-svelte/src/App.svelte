<script lang="ts">
  import DemoHero from './lib/inspector-demo/DemoHero.svelte'
  import ShortcutPanel from './lib/inspector-demo/ShortcutPanel.svelte'
  import StepCards from './lib/inspector-demo/StepCards.svelte'
  import TryTargets from './lib/inspector-demo/TryTargets.svelte'
</script>

<main class="inspector-demo">
  <section class="inspector-shell" aria-labelledby="inspector-title">
    <DemoHero />
    <ShortcutPanel />
    <StepCards />
    <TryTargets />
  </section>
</main>
