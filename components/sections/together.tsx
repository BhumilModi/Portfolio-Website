import { HERO, TOGETHER } from "@/lib/content";
import Art from "./art";
import CopyCommand from "./copy-command";
import SectionLabel from "./section-label";

export default function Together() {
  return (
    <section id="together" className="relative isolate overflow-hidden bg-void text-bone">
      <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-4 py-24 md:grid-cols-[0.9fr_1.1fr] md:items-center md:px-8">
        <Art name="bust" className="aspect-[4/5] w-full text-bone opacity-70 max-md:max-h-[60svh]" />
        <div className="flex flex-col gap-10">
          <SectionLabel title={TOGETHER.title}>{TOGETHER.label}</SectionLabel>
          <dl className="border-b border-bone/30">
            {TOGETHER.facts.map((f) => (
              <div key={f.k} className="reveal grid gap-1 border-t border-bone/30 py-4 md:grid-cols-[160px_1fr] md:gap-6">
                <dt className="font-mono text-xs uppercase tracking-[0.16em] text-bone/75">{f.k}</dt>
                <dd className="text-lg">{f.v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-3">
            {TOGETHER.actions.map((a, i) => (
              <a
                key={a.href}
                href={a.href}
                {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className={
                  i === 0
                    ? "bg-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-void transition-transform active:scale-[0.97]"
                    : "border border-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-transform transition-colors duration-150 hover:bg-bone hover:text-void active:scale-[0.97]"
                }
              >
                {a.label}
              </a>
            ))}
          </div>
          <CopyCommand command={HERO.command} copyText={HERO.copyText} />
        </div>
      </div>
    </section>
  );
}
