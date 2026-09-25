import { CASES } from "@/lib/content";
import CaseDialog from "./case-dialog";
import SectionLabel from "./section-label";

export default function Cases() {
  return (
    <section id="cases" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={CASES.title}>{CASES.label}</SectionLabel>
      <p className="mt-6 max-w-[60ch] text-lg text-bone/90">{CASES.intro}</p>
      <ol className="mt-12 grid gap-px bg-bone/25 md:grid-cols-2 lg:grid-cols-4">
        {CASES.items.map((c) => (
          <li key={c.numeral} className="reveal flex flex-col gap-5 bg-field p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-7xl leading-none">{c.numeral}</span>
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">{c.figure}</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-bone/85">{c.meta}</p>
            <h3 className="cap-trim font-display text-4xl uppercase leading-[0.95]">{c.title}</h3>
            <p className="text-bone/90">{c.situation}</p>
            <div className="mt-auto pt-4">
              <CaseDialog item={c} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
