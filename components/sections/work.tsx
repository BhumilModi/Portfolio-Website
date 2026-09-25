import { WORK } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Work() {
  return (
    <section id="work" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={WORK.title}>{WORK.label}</SectionLabel>
      <p className="mt-6 max-w-[60ch] text-lg text-bone/90">{WORK.intro}</p>
      <ul className="mt-12 grid gap-px bg-bone/25 sm:grid-cols-2 lg:grid-cols-4">
        {WORK.agents.map((a, i) => (
          <li key={a.title} className="reveal flex flex-col gap-3 bg-field p-6">
            <span className="font-mono text-xs text-bone/85">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-display text-3xl leading-none tracking-[-0.01em]">{a.title}</h3>
            <p className="text-sm text-bone/90">{a.body}</p>
          </li>
        ))}
      </ul>
      <h3 className="mt-20 font-mono text-xs uppercase tracking-[0.18em] text-bone/85">{WORK.platformsLabel}</h3>
      <ul className="mt-6 grid gap-6 md:grid-cols-3">
        {WORK.platforms.map((p) => (
          <li key={p.name} className="reveal flex flex-col gap-4 border border-bone/40 bg-void p-6 transition-colors duration-150 hover:border-bone/70">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="font-display text-4xl leading-none tracking-[-0.01em]">{p.name}</h4>
              <span className="shrink-0 font-mono text-xs text-ember">{p.meta}</span>
            </div>
            <p className="text-bone/90">{p.body}</p>
            <p className="mt-auto font-mono text-xs uppercase tracking-[0.14em] text-bone/85">{p.role}</p>
            {p.href && (
              <a href={p.href} target="_blank" rel="noreferrer" className="font-mono text-xs uppercase tracking-[0.16em] underline underline-offset-4 transition-colors duration-150 hover:no-underline active:scale-[0.97]">
                View on GitHub ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
