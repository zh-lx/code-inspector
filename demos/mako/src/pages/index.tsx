import { DemoHero } from '../components/inspector-demo/DemoHero';
import { ShortcutPanel } from '../components/inspector-demo/ShortcutPanel';
import { StepCards } from '../components/inspector-demo/StepCards';
import { TryTargets } from '../components/inspector-demo/TryTargets';

export default function HomePage() {
  return (
    <main className="inspector-demo">
      <section className="inspector-shell" aria-labelledby="inspector-title">
        <DemoHero />
        <ShortcutPanel />
        <StepCards />
        <TryTargets />
      </section>
    </main>
  );
}
