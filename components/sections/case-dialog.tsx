"use client";
import { useRef, useState } from "react";
import type { CaseItem } from "@/lib/content";
import ArgusDemo from "./argus-demo";
import DaedalusDemo from "./daedalus-demo";

export default function CaseDialog({ item }: { item: CaseItem }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Demos mount only while open, so closing mid-run clears their timers and each open starts fresh.
  const [open, setOpen] = useState(false);
  const headingId = `case-${item.numeral}`;
  const rows = [
    ["Situation", item.situation],
    ["Decision", item.decision],
    ["Result", item.result],
  ] as const;
  return (
    <>
      <button type="button" onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }} className="font-mono text-xs uppercase tracking-[0.16em] underline underline-offset-4 hover:no-underline">
        Open case {item.numeral} →
      </button>
      <dialog
        ref={ref}
        aria-labelledby={headingId}
        className="case-dialog"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close(); // backdrop click
        }}
      >
        <div className="flex flex-col gap-6 p-6 md:p-10">
          <div className="flex items-start justify-between gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-bone/85">
              Case {item.numeral} · {item.figure} · {item.meta}
            </p>
            <button type="button" onClick={() => ref.current?.close()} className="font-mono text-xs uppercase tracking-[0.16em]">
              Close ✕
            </button>
          </div>
          <h3 id={headingId} className="cap-trim font-display text-5xl tracking-[-0.01em] md:text-6xl">{item.title}</h3>
          <dl className="grid gap-6 md:grid-cols-3">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-2">
                <dt className="font-mono text-xs uppercase tracking-[0.16em] text-ember">{k}</dt>
                <dd className="text-bone/90">{v}</dd>
              </div>
            ))}
          </dl>
          {open && item.demo === "argus" && <ArgusDemo />}
          {open && item.demo === "daedalus" && <DaedalusDemo />}
        </div>
      </dialog>
    </>
  );
}
