import { HERO } from "@/lib/content";
import CardArt from "@/components/experience/card-art";
import CopyCommand from "./copy-command";

export default function Hero() {
  return (
    <section id="hero" className="mx-auto grid w-full max-w-[1280px] scroll-mt-4 gap-10 px-4 pb-24 pt-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-8 md:pt-16">
      <div className="flex flex-col gap-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-bone/85">{HERO.eyebrow}</p>
        <h1 className="cap-trim font-display text-[clamp(3.5rem,9vw,8.5rem)] uppercase leading-[0.9]">{HERO.title}</h1>
        <p className="max-w-[46ch] text-lg leading-relaxed text-bone/90 md:text-xl">{HERO.lede}</p>
        <div className="flex flex-wrap gap-3">
          {HERO.actions.map((a, i) => (
            <a
              key={a.href}
              href={a.href}
              {...(a.external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={
                i === 0
                  ? "bg-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-field transition-transform active:scale-[0.97]"
                  : "border border-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-transform transition-colors duration-150 hover:bg-bone hover:text-field active:scale-[0.97]"
              }
            >
              {a.label}
            </a>
          ))}
        </div>
        <CopyCommand command={HERO.command} copyText={HERO.copyText} />
      </div>
      <CardArt art="bust" className="art-slot aspect-[4/5] w-full" parallax />
    </section>
  );
}
