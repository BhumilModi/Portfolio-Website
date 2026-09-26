import Link from "next/link";
import { UNDERWORLD } from "@/lib/content";

export default function Gate({ count }: { count: number }) {
  return (
    <section className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex max-w-[40ch] flex-col items-center gap-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-asphodel/70">{UNDERWORLD.gate.eyebrow}</p>
        <h1 className="cap-trim font-display text-[clamp(3rem,10vw,7rem)] uppercase leading-[0.9]">{UNDERWORLD.gate.title}</h1>
        <p className="font-serif text-lg italic text-asphodel/85">{UNDERWORLD.gate.body.replace("{n}", String(count))}</p>
        <Link href="/#hero" className="border border-asphodel/60 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-150 hover:bg-asphodel hover:text-abyss active:scale-[0.97]">
          {UNDERWORLD.gate.back}
        </Link>
      </div>
    </section>
  );
}
