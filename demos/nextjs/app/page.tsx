import { DemoHero } from './components/inspector-demo/DemoHero';
import { ShortcutPanel } from './components/inspector-demo/ShortcutPanel';
import { StepCards } from './components/inspector-demo/StepCards';
import { TryTargets } from './components/inspector-demo/TryTargets';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f9fc] bg-[linear-gradient(135deg,#f7f9fc_0%,#eef6f3_48%,#fff7e8_100%)] px-6 py-12 text-[#17202f]">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl flex-col justify-center">
        <DemoHero />
        <ShortcutPanel />
        <StepCards />
        <TryTargets />
      </section>
    </main>
  );
}
