import { RECORD } from "@/lib/content";
import SectionLabel from "./section-label";
import Art from "./art";

export default function Record() {
  return (
    <section id="record" className="bg-paper text-ink">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
        <div className="flex items-end justify-between gap-6">
          <SectionLabel title={RECORD.title}>{RECORD.label}</SectionLabel>
          <Art name="amphora" className="hidden h-44 w-36 shrink-0 text-ink md:block" />
        </div>
        <ol className="mt-12 flex flex-col font-mono text-sm">
          {RECORD.roles.map((r) => (
            <li key={`${r.when}-${r.where}`} className="reveal grid gap-2 border-t border-ink/25 py-5 md:grid-cols-[180px_240px_1fr] md:gap-6">
              <span className="text-ink/70">{r.when}</span>
              <span>
                <span className="block uppercase tracking-[0.12em]">{r.where}</span>
                <span className="block text-ink/70">{r.role}</span>
              </span>
              <span className="font-serif text-base text-ink/85">{r.line}</span>
            </li>
          ))}
        </ol>
        <dl className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-5">
          {RECORD.toolkit.map((t) => (
            <div key={t.group} className="flex flex-col gap-3">
              <dt className="font-mono text-xs uppercase tracking-[0.16em]">{t.group}</dt>
              <dd>
                <ul className="flex flex-col gap-1 font-mono text-sm text-ink/70">
                  {t.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
