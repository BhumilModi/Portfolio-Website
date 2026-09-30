import type { Metadata } from "next";
import Link from "next/link";
import Art from "@/components/sections/art";
import { NOT_FOUND } from "@/lib/content";

export const metadata: Metadata = { title: NOT_FOUND.metaTitle };

export default function NotFound() {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden px-4 text-center">
      {/* Piranesi's Imaginary Prisons: stairs to nowhere, the right room for a wrong turn. */}
      <Art name="carceri" className="absolute inset-0 -z-10 text-void opacity-35 [mask-size:cover]" />
      <div className="flex max-w-[40ch] flex-col items-center gap-6">
        <h1 className="cap-trim text-balance font-display text-[clamp(3.5rem,11vw,6rem)] uppercase leading-[0.9]">{NOT_FOUND.title}</h1>
        <p className="text-pretty font-serif text-lg italic text-bone/90 md:text-xl">{NOT_FOUND.body}</p>
        <Link href="/" className="bg-bone px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-field transition-transform duration-150 active:scale-[0.97]">
          {NOT_FOUND.back}
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] tabular-nums text-bone/85">{NOT_FOUND.code}</p>
      </div>
    </main>
  );
}
