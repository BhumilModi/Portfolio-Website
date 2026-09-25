import { ENGAGEMENT } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Engagement() {
  return (
    <section id="engagement" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel>{ENGAGEMENT.label}</SectionLabel>
      <ol className="mt-10 grid gap-px bg-bone/25 md:grid-cols-4">
        {ENGAGEMENT.phases.map((p, i) => (
          <li key={p.name} className="reveal flex flex-col gap-4 bg-field p-6">
            <span className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">
              {String(i + 1).padStart(2, "0")} · {p.when}
            </span>
            <h3 className="cap-trim font-display text-5xl uppercase">{p.name}</h3>
            <p className="text-bone/90">{p.body}</p>
          </li>
        ))}
      </ol>
      <dl className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-5">
        {ENGAGEMENT.stats.map((s) => (
          <div key={s.label} className="reveal flex flex-col-reverse gap-2 border-t border-bone/40 pt-4">
            <dt className="font-mono text-xs uppercase tracking-[0.12em] text-bone/85">{s.label}</dt>
            <dd className="font-display text-6xl leading-none">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
