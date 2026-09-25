import { APPROACH } from "@/lib/content";
import CardArt from "@/components/experience/card-art";
import SectionLabel from "./section-label";

export default function Approach() {
  return (
    <section id="approach" className="mx-auto w-full max-w-[1280px] px-4 py-24 md:px-8">
      <SectionLabel title={APPROACH.title}>{APPROACH.label}</SectionLabel>
      <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {APPROACH.items.map((item) => (
          <li key={item.n} className="reveal flex flex-col gap-5">
            <CardArt art={item.art} className="art-slot aspect-[2/1] w-full border border-bone/40" />
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">#{item.n} {item.label}</p>
            <h3 className="cap-trim font-display text-4xl tracking-[-0.01em]">{item.title}</h3>
            <p className="text-bone/90">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
