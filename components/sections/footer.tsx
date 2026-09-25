import { FOOTER } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-0 isolate flex h-dvh flex-col justify-between overflow-hidden bg-field bg-[url(/art/relief.jpg)] bg-cover bg-center px-4 pb-6 pt-24 text-bone md:px-8">
      {/* Relief wash (CC0 — The Met), Portal-style. Scrim keeps a contrast floor everywhere (never fully transparent) so link, title and meta text stay ≥4.5:1 even over the relief's brightest fold. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-field/70 via-field/35 via-45% to-field/70" />

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
        <p className="font-serif text-3xl italic leading-[1.15] md:text-5xl">{FOOTER.line}</p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {FOOTER.columns.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone">{c.title}</p>
              <ul className="flex flex-col gap-2 font-mono text-sm uppercase tracking-[0.12em]">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="break-all underline underline-offset-4 transition-colors duration-150 hover:no-underline active:scale-[0.97]">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px]">
        <p aria-hidden className="cap-trim select-none font-display text-[clamp(4rem,19vw,20rem)] uppercase leading-[0.8]">{FOOTER.wordmark}</p>
        <div className="mt-6 flex flex-wrap justify-between gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-bone/90">
          {FOOTER.meta.map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </footer>
  );
}
