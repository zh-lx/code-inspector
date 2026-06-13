import { component$ } from '@builder.io/qwik'
import { DemoHero } from './components/inspector-demo/DemoHero'
import { ShortcutPanel } from './components/inspector-demo/ShortcutPanel'
import { StepCards } from './components/inspector-demo/StepCards'
import { TryTargets } from './components/inspector-demo/TryTargets'
import './app.css'

export const App = component$(() => {
  return (
    <main class="inspector-demo">
      <section class="inspector-shell" aria-labelledby="inspector-title">
        <DemoHero />
        <ShortcutPanel />
        <StepCards />
        <TryTargets />
      </section>
    </main>
  )
})
