import { FAQ } from "@/lib/content";
import SectionLabel from "./section-label";

export default function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={FAQ.title}>{FAQ.label}</SectionLabel>
      <div className="mt-12 border-b border-bone/30">
        {FAQ.items.map((item) => (
          <details key={item.q} className="faq group border-t border-bone/30">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-xl underline decoration-bone/40 underline-offset-[6px] transition-colors duration-150 hover:decoration-bone md:text-2xl">
              {item.q}
              <span aria-hidden className="shrink-0 font-mono text-base transition-transform duration-200 ease-out group-open:rotate-45">+</span>
            </summary>
            <p className="max-w-[70ch] pb-6 text-lg text-bone/90">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
