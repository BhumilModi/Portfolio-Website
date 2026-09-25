import { FOOTER } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-0 flex h-dvh flex-col justify-between bg-void px-4 pb-6 pt-24 text-bone md:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
        <p className="font-serif text-3xl italic leading-[1.15] md:text-5xl">{FOOTER.line}</p>
        <ul className="grid gap-4 font-mono text-sm uppercase tracking-[0.14em] md:grid-cols-4">
          {FOOTER.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className="underline underline-offset-4 transition-colors duration-150 hover:no-underline active:scale-[0.97]">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="mx-auto w-full max-w-[1280px]">
        <p aria-hidden className="cap-trim select-none font-display text-[clamp(4rem,19vw,20rem)] uppercase leading-[0.8]">{FOOTER.wordmark}</p>
        <div className="mt-6 flex justify-between font-mono text-xs uppercase tracking-[0.14em] text-bone/70">
          <span>{FOOTER.meta[0]}</span>
          <span>{FOOTER.meta[1]}</span>
        </div>
      </div>
    </footer>
  );
}
