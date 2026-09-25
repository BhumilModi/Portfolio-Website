export default function SectionLabel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-bone/85">
        <span aria-hidden className="inline-block size-2 bg-bone" />
        {children}
      </p>
      {title && (
        <h2 className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-[0.9]">{title}</h2>
      )}
    </div>
  );
}
