import { CASES } from "@/lib/content";
import CaseDialog from "./case-dialog";
import SectionLabel from "./section-label";
import Art from "./art";

export default function Cases() {
  return (
    <section id="cases" className="bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
        <SectionLabel title={CASES.title}>{CASES.label}</SectionLabel>
        <p className="mt-6 max-w-[60ch] text-lg text-ink/85">{CASES.intro}</p>
        <div className="relative mt-12 aspect-[16/9] overflow-hidden bg-field md:aspect-[3/1]">
          <Art name="sant-angelo" className="absolute inset-0 text-void [mask-size:cover]" />
        </div>
        <ol className="grid gap-px border-x border-b border-ink/20 bg-ink/20 md:grid-cols-2 lg:grid-cols-4">
          {CASES.items.map((c) => (
            <li key={c.numeral} className="reveal flex flex-col gap-5 bg-paper p-6">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-7xl leading-none">{c.numeral}</span>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-ink/70">{c.figure}</span>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink/70">{c.meta}</p>
              <h3 className="cap-trim font-display text-4xl leading-[0.95] tracking-[-0.01em]">{c.title}</h3>
              <p className="text-ink/85">{c.situation}</p>
              <div className="mt-auto pt-4">
                <CaseDialog item={c} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
