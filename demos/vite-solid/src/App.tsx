import { DemoHero } from './components/inspector-demo/DemoHero'
import { ShortcutPanel } from './components/inspector-demo/ShortcutPanel'
import { StepCards } from './components/inspector-demo/StepCards'
import { TryTargets } from './components/inspector-demo/TryTargets'
import './App.css'

function App() {
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
}

export default App
