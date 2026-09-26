import { UNDERWORLD } from "@/lib/content";

export default function Arrival() {
  return (
    <section aria-labelledby="ryuma" className="mx-auto flex min-h-[80dvh] w-full max-w-[1280px] flex-col justify-end gap-6 px-4 pb-24 md:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-soulfire">{UNDERWORLD.eyebrow}</p>
      <h1 id="ryuma" className="soul-glow cap-trim font-display text-[clamp(5rem,18vw,16rem)] uppercase leading-[0.85]">{UNDERWORLD.name}</h1>
      <p className="max-w-[40ch] font-serif text-2xl italic text-asphodel/90 md:text-3xl">{UNDERWORLD.line}</p>
    </section>
  );
}
