export default function SectionLabel({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] opacity-80">
        <span aria-hidden>{"//"}</span>
        {children}
      </p>
      {title && (
        <h2 className="cap-trim font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-[-0.01em]">{title}</h2>
      )}
    </div>
  );
}
