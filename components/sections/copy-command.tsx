"use client";
import { useState } from "react";

export default function CopyCommand({ command, copyText }: { command: string; copyText: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: the command stays selectable
    }
  }
  return (
    <div className="flex max-w-xl items-center justify-between gap-4 border border-bone/40 bg-void px-4 py-3 font-mono text-sm">
      <code className="truncate select-all"><span className="text-ember">$</span> {command}</code>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className="shrink-0 text-xs uppercase tracking-[0.16em] text-bone/85 transition-transform transition-colors duration-150 hover:text-bone active:scale-[0.97]"
      >
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
