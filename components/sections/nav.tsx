import { NAV } from "@/lib/content";

export default function Nav() {
  return (
    <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-4 py-4 md:grid md:grid-cols-[1fr_auto_1fr] md:px-8">
      <a href="#hero" className="font-display text-3xl leading-none tracking-wide">{NAV.brand}</a>
      <nav aria-label="Sections" className="hidden gap-6 font-mono text-xs uppercase tracking-[0.16em] md:flex">
        {NAV.links.map((l) => (
          <a key={l.href} href={l.href} className="text-bone/85 transition-colors hover:text-bone">{l.label}</a>
        ))}
      </nav>
      <a
        href={NAV.cta.href}
        className="justify-self-end border border-bone px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition-transform transition-colors duration-150 hover:bg-bone hover:text-field active:scale-[0.97]"
      >
        {NAV.cta.label}
      </a>
    </header>
  );
}
